import { Injectable } from '@nestjs/common';
import type { Prisma } from '@vs/db';
import { TenantPrisma } from '@vs/db';
import {
  cmsBlocksSchema,
  errors,
  type CmsBlock,
  type CmsPageAdmin,
  type CmsVersionView,
  type LegalDocumentView,
  type SiteFaqItem,
  type SiteLegalVersion,
  type SitePageView,
} from '@vs/shared';
import { AuditService } from '../audit/audit.service';
import type {
  CreateCmsPageDto,
  CreateFaqItemDto,
  CreateLegalVersionDto,
  UpdateCmsPageDto,
  UpdateFaqItemDto,
} from './dto/cms.dto';

@Injectable()
export class CmsService {
  constructor(
    private readonly tenantPrisma: TenantPrisma,
    private readonly audit: AuditService,
  ) {}

  async listPages(tenantId: string): Promise<CmsPageAdmin[]> {
    const pages = await this.tenantPrisma.run(tenantId, (tx) =>
      tx.cmsPage.findMany({
        where: { tenantId },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
        include: { versions: { orderBy: { version: 'desc' } } },
      }),
    );

    return pages.map((page) => this.toAdminPage(page, page.versions));
  }

  async getPage(tenantId: string, slug: string): Promise<CmsPageAdmin> {
    const page = await this.tenantPrisma.run(tenantId, (tx) =>
      tx.cmsPage.findUnique({
        where: { tenantId_slug: { tenantId, slug } },
        include: { versions: { orderBy: { version: 'desc' } } },
      }),
    );

    if (!page) {
      throw errors.notFound('Página não encontrada');
    }

    return this.toAdminPage(page, page.versions);
  }

  async createPage(
    tenantId: string,
    actorId: string,
    input: CreateCmsPageDto,
    correlationId: string,
  ): Promise<CmsPageAdmin> {
    const blocks = parseBlocks(input.blocks);

    const page = await this.tenantPrisma.run(tenantId, async (tx) => {
      const existing = await tx.cmsPage.findUnique({
        where: { tenantId_slug: { tenantId, slug: input.slug } },
        select: { id: true },
      });
      if (existing) {
        throw errors.conflict('Já existe uma página com este slug');
      }

      return tx.cmsPage.create({
        data: {
          tenantId,
          slug: input.slug,
          title: input.title,
          seoTitle: input.seoTitle ?? null,
          seoDescription: input.seoDescription ?? null,
          draftBlocks: blocks,
          sortOrder: input.sortOrder ?? 0,
          showInNav: input.showInNav ?? true,
        },
        include: { versions: true },
      });
    });

    await this.audit.record({
      tenantId,
      actorId,
      action: 'cms.page.create',
      entity: 'CmsPage',
      entityId: page.id,
      correlationId,
      diff: { slug: page.slug, title: page.title },
    });

    return this.toAdminPage(page, page.versions);
  }

  async updateDraft(
    tenantId: string,
    slug: string,
    actorId: string,
    input: UpdateCmsPageDto,
    correlationId: string,
  ): Promise<CmsPageAdmin> {
    const blocks =
      input.blocks === undefined ? undefined : parseBlocks(input.blocks);

    const page = await this.tenantPrisma.run(tenantId, async (tx) => {
      const existing = await tx.cmsPage.findUnique({
        where: { tenantId_slug: { tenantId, slug } },
        select: { id: true },
      });
      if (!existing) {
        throw errors.notFound('Página não encontrada');
      }

      return tx.cmsPage.update({
        where: { id: existing.id },
        data: {
          ...(input.title === undefined ? {} : { title: input.title }),
          ...(input.seoTitle === undefined
            ? {}
            : { seoTitle: input.seoTitle || null }),
          ...(input.seoDescription === undefined
            ? {}
            : { seoDescription: input.seoDescription || null }),
          ...(blocks === undefined ? {} : { draftBlocks: blocks }),
          ...(input.sortOrder === undefined
            ? {}
            : { sortOrder: input.sortOrder }),
          ...(input.showInNav === undefined
            ? {}
            : { showInNav: input.showInNav }),
          draftUpdatedAt: new Date(),
        },
        include: { versions: { orderBy: { version: 'desc' } } },
      });
    });

    await this.audit.record({
      tenantId,
      actorId,
      action: 'cms.page.draft.update',
      entity: 'CmsPage',
      entityId: page.id,
      correlationId,
      diff: { slug: page.slug },
    });

    return this.toAdminPage(page, page.versions);
  }

  async publish(
    tenantId: string,
    slug: string,
    actorId: string,
    correlationId: string,
  ): Promise<CmsPageAdmin> {
    const page = await this.tenantPrisma.run(tenantId, async (tx) => {
      const existing = await tx.cmsPage.findUnique({
        where: { tenantId_slug: { tenantId, slug } },
      });
      if (!existing) {
        throw errors.notFound('Página não encontrada');
      }

      const blocks = parseBlocks(existing.draftBlocks);
      const version = await this.createVersion(tx, {
        tenantId,
        pageId: existing.id,
        title: existing.title,
        seoTitle: existing.seoTitle,
        seoDescription: existing.seoDescription,
        blocks,
        actorId,
      });

      return tx.cmsPage.update({
        where: { id: existing.id },
        data: {
          publishedVersionId: version.id,
          publishedAt: new Date(),
        },
        include: { versions: { orderBy: { version: 'desc' } } },
      });
    });

    await this.audit.record({
      tenantId,
      actorId,
      action: 'cms.page.publish',
      entity: 'CmsPage',
      entityId: page.id,
      correlationId,
      diff: { slug: page.slug, versionId: page.publishedVersionId },
    });

    return this.toAdminPage(page, page.versions);
  }

  async revert(
    tenantId: string,
    slug: string,
    versionId: string,
    actorId: string,
    correlationId: string,
  ): Promise<CmsPageAdmin> {
    await this.tenantPrisma.run(tenantId, async (tx) => {
      const page = await tx.cmsPage.findUnique({
        where: { tenantId_slug: { tenantId, slug } },
        select: { id: true },
      });
      if (!page) {
        throw errors.notFound('Página não encontrada');
      }

      const version = await tx.cmsVersion.findFirst({
        where: { id: versionId, tenantId, pageId: page.id },
      });
      if (!version) {
        throw errors.notFound('Versão não encontrada');
      }

      await tx.cmsPage.update({
        where: { id: page.id },
        data: {
          title: version.title,
          seoTitle: version.seoTitle,
          seoDescription: version.seoDescription,
          draftBlocks: version.blocks as Prisma.InputJsonValue,
          draftUpdatedAt: new Date(),
        },
      });
    });

    const published = await this.publish(tenantId, slug, actorId, correlationId);

    await this.audit.record({
      tenantId,
      actorId,
      action: 'cms.page.revert',
      entity: 'CmsPage',
      entityId: published.id,
      correlationId,
      diff: { slug, fromVersionId: versionId },
    });

    return published;
  }

  async getPublishedPage(
    tenantId: string,
    slug: string,
  ): Promise<SitePageView | null> {
    const page = await this.tenantPrisma.run(tenantId, (tx) =>
      tx.cmsPage.findFirst({
        where: { tenantId, slug, publishedVersionId: { not: null } },
      }),
    );

    if (!page?.publishedVersionId) {
      return null;
    }

    const version = await this.tenantPrisma.run(tenantId, (tx) =>
      tx.cmsVersion.findFirst({
        where: { id: page.publishedVersionId ?? undefined, tenantId },
      }),
    );

    if (!version) {
      return null;
    }

    return {
      slug: page.slug,
      title: version.title,
      seoTitle: version.seoTitle,
      seoDescription: version.seoDescription,
      blocks: parseStoredBlocks(version.blocks),
    };
  }

  async getNavigation(
    tenantId: string,
  ): Promise<Array<{ slug: string; title: string }>> {
    return this.tenantPrisma.run(tenantId, (tx) =>
      tx.cmsPage.findMany({
        where: {
          tenantId,
          showInNav: true,
          publishedVersionId: { not: null },
        },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
        select: { slug: true, title: true },
      }),
    );
  }

  async getPublishedFaq(tenantId: string): Promise<SiteFaqItem[]> {
    return this.tenantPrisma.run(tenantId, (tx) =>
      tx.faqItem.findMany({
        where: { tenantId, published: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, question: true, answer: true },
      }),
    );
  }

  async listFaq(tenantId: string): Promise<SiteFaqItem[]> {
    return this.tenantPrisma.run(tenantId, (tx) =>
      tx.faqItem.findMany({
        where: { tenantId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, question: true, answer: true },
      }),
    );
  }

  async createFaq(
    tenantId: string,
    actorId: string,
    input: CreateFaqItemDto,
    correlationId: string,
  ): Promise<SiteFaqItem> {
    const item = await this.tenantPrisma.run(tenantId, async (tx) => {
      const existing = await tx.faqItem.findUnique({
        where: {
          tenantId_question: { tenantId, question: input.question },
        },
        select: { id: true },
      });
      if (existing) {
        throw errors.conflict('Já existe uma pergunta com este texto');
      }

      return tx.faqItem.create({
        data: {
          tenantId,
          question: input.question,
          answer: input.answer,
          sortOrder: input.sortOrder ?? 0,
          published: input.published ?? true,
        },
        select: { id: true, question: true, answer: true },
      });
    });

    await this.audit.record({
      tenantId,
      actorId,
      action: 'cms.faq.create',
      entity: 'FaqItem',
      entityId: item.id,
      correlationId,
    });

    return item;
  }

  async updateFaq(
    tenantId: string,
    id: string,
    actorId: string,
    input: UpdateFaqItemDto,
    correlationId: string,
  ): Promise<SiteFaqItem> {
    const item = await this.tenantPrisma.run(tenantId, async (tx) => {
      const existing = await tx.faqItem.findFirst({
        where: { id, tenantId },
        select: { id: true },
      });
      if (!existing) {
        throw errors.notFound('Pergunta não encontrada');
      }

      return tx.faqItem.update({
        where: { id: existing.id },
        data: {
          ...(input.question === undefined
            ? {}
            : { question: input.question }),
          ...(input.answer === undefined ? {} : { answer: input.answer }),
          ...(input.sortOrder === undefined
            ? {}
            : { sortOrder: input.sortOrder }),
          ...(input.published === undefined
            ? {}
            : { published: input.published }),
        },
        select: { id: true, question: true, answer: true },
      });
    });

    await this.audit.record({
      tenantId,
      actorId,
      action: 'cms.faq.update',
      entity: 'FaqItem',
      entityId: id,
      correlationId,
    });

    return item;
  }

  async deleteFaq(
    tenantId: string,
    id: string,
    actorId: string,
    correlationId: string,
  ): Promise<void> {
    await this.tenantPrisma.run(tenantId, async (tx) => {
      const existing = await tx.faqItem.findFirst({
        where: { id, tenantId },
        select: { id: true },
      });
      if (!existing) {
        throw errors.notFound('Pergunta não encontrada');
      }
      await tx.faqItem.delete({ where: { id } });
    });

    await this.audit.record({
      tenantId,
      actorId,
      action: 'cms.faq.delete',
      entity: 'FaqItem',
      entityId: id,
      correlationId,
    });
  }

  async listLegal(tenantId: string): Promise<LegalDocumentView[]> {
    const documents = await this.tenantPrisma.run(tenantId, (tx) =>
      tx.legalDocument.findMany({
        where: { tenantId },
        orderBy: [{ slug: 'asc' }, { version: 'desc' }],
      }),
    );

    return documents.map((document) => ({
      slug: document.slug,
      title: document.title,
      version: document.version,
      body: document.body,
      effectiveAt: document.effectiveAt.toISOString(),
    }));
  }

  async getCurrentLegal(
    tenantId: string,
    slug: string,
  ): Promise<LegalDocumentView | null> {
    const document = await this.tenantPrisma.run(tenantId, (tx) =>
      tx.legalDocument.findFirst({
        where: { tenantId, slug, effectiveAt: { lte: new Date() } },
        orderBy: { version: 'desc' },
      }),
    );

    if (!document) {
      return null;
    }

    return {
      slug: document.slug,
      title: document.title,
      version: document.version,
      body: document.body,
      effectiveAt: document.effectiveAt.toISOString(),
    };
  }

  async getLegalSummary(
    tenantId: string,
  ): Promise<{ privacy: SiteLegalVersion | null; terms: SiteLegalVersion | null }> {
    const [privacy, terms] = await Promise.all([
      this.getCurrentLegal(tenantId, 'privacidade'),
      this.getCurrentLegal(tenantId, 'termos'),
    ]);

    return {
      privacy: privacy
        ? {
            slug: privacy.slug,
            title: privacy.title,
            version: privacy.version,
            effectiveAt: privacy.effectiveAt,
          }
        : null,
      terms: terms
        ? {
            slug: terms.slug,
            title: terms.title,
            version: terms.version,
            effectiveAt: terms.effectiveAt,
          }
        : null,
    };
  }

  async createLegalVersion(
    tenantId: string,
    slug: string,
    actorId: string,
    input: CreateLegalVersionDto,
    correlationId: string,
  ): Promise<LegalDocumentView> {
    const effectiveAt = input.effectiveAt
      ? new Date(input.effectiveAt)
      : new Date();
    if (Number.isNaN(effectiveAt.getTime())) {
      throw errors.validation('Data de vigência inválida');
    }

    const document = await this.tenantPrisma.run(tenantId, async (tx) => {
      const latest = await tx.legalDocument.findFirst({
        where: { tenantId, slug },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      return tx.legalDocument.create({
        data: {
          tenantId,
          slug,
          version: (latest?.version ?? 0) + 1,
          title: input.title,
          body: input.body,
          effectiveAt,
          createdById: actorId,
        },
      });
    });

    await this.audit.record({
      tenantId,
      actorId,
      action: 'cms.legal.version.create',
      entity: 'LegalDocument',
      entityId: document.id,
      correlationId,
      diff: { slug, version: document.version },
    });

    return {
      slug: document.slug,
      title: document.title,
      version: document.version,
      body: document.body,
      effectiveAt: document.effectiveAt.toISOString(),
    };
  }

  private async createVersion(
    tx: Prisma.TransactionClient,
    input: {
      tenantId: string;
      pageId: string;
      title: string;
      seoTitle: string | null;
      seoDescription: string | null;
      blocks: CmsBlock[];
      actorId: string;
    },
  ) {
    const latest = await tx.cmsVersion.findFirst({
      where: { tenantId: input.tenantId, pageId: input.pageId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    return tx.cmsVersion.create({
      data: {
        tenantId: input.tenantId,
        pageId: input.pageId,
        version: (latest?.version ?? 0) + 1,
        title: input.title,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        blocks: input.blocks,
        createdById: input.actorId,
      },
    });
  }

  private toAdminPage(
    page: {
      id: string;
      slug: string;
      title: string;
      seoTitle: string | null;
      seoDescription: string | null;
      draftBlocks: unknown;
      draftUpdatedAt: Date;
      publishedVersionId: string | null;
      publishedAt: Date | null;
      sortOrder: number;
      showInNav: boolean;
      isSystem: boolean;
    },
    versions: Array<{
      id: string;
      version: number;
      title: string;
      seoTitle: string | null;
      seoDescription: string | null;
      blocks: unknown;
      createdAt: Date;
    }>,
  ): CmsPageAdmin {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      draftBlocks: parseStoredBlocks(page.draftBlocks),
      draftUpdatedAt: page.draftUpdatedAt.toISOString(),
      publishedVersionId: page.publishedVersionId,
      publishedAt: page.publishedAt?.toISOString() ?? null,
      sortOrder: page.sortOrder,
      showInNav: page.showInNav,
      isSystem: page.isSystem,
      versions: versions.map(
        (version): CmsVersionView => ({
          id: version.id,
          version: version.version,
          title: version.title,
          seoTitle: version.seoTitle,
          seoDescription: version.seoDescription,
          blocks: parseStoredBlocks(version.blocks),
          createdAt: version.createdAt.toISOString(),
        }),
      ),
    };
  }
}

function parseBlocks(input: unknown): CmsBlock[] {
  const result = cmsBlocksSchema.safeParse(input);
  if (!result.success) {
    throw errors.validation('Blocos de conteúdo inválidos', result.error.issues);
  }
  return result.data;
}

function parseStoredBlocks(input: unknown): CmsBlock[] {
  const result = cmsBlocksSchema.safeParse(input);
  return result.success ? result.data : [];
}
