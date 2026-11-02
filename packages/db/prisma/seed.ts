import { hash } from '@node-rs/argon2';
import { config } from 'dotenv';
import { createAdminPrismaClient } from '../src/client';

config({ path: ['../../.env', '../../.env.local', '.env'] });

const prisma = createAdminPrismaClient();

const PASSWORD = 'SenhaForte123!';

const defaultPages = [
  {
    slug: 'home',
    title: 'Início',
    seoTitle: 'Instalação e manutenção de ar-condicionado',
    seoDescription:
      'Instalação, manutenção e higienização de ar-condicionado com atendimento local e orçamento sem surpresa.',
    sortOrder: 0,
    showInNav: false,
    blocks: [
      {
        type: 'hero',
        title: 'Conforto térmico sem dor de cabeça',
        subtitle:
          'Instalação, manutenção e higienização de ar-condicionado com diagnóstico claro e orçamento sem surpresa.',
        ctaLabel: 'Solicitar orçamento',
        ctaHref: '#contato',
      },
      {
        type: 'services',
        title: 'Serviços',
        items: [
          {
            title: 'Instalação',
            description:
              'Dimensionamento correto, instalação limpa e testes de funcionamento.',
          },
          {
            title: 'Manutenção preventiva',
            description:
              'Revisão periódica para reduzir consumo e evitar paradas inesperadas.',
          },
          {
            title: 'Higienização',
            description:
              'Limpeza técnica de evaporadora, filtros e dutos para melhorar o ar.',
          },
          {
            title: 'Projetos e infraestrutura',
            description:
              'Suporte para obras novas, reformas e ambientes comerciais.',
          },
        ],
      },
      {
        type: 'text',
        title: 'Atendimento próximo',
        body:
          'Atendemos residências e empresas com orientação técnica em cada etapa. Você recebe uma estimativa inicial, confirma o escopo e acompanha o serviço com previsibilidade.',
      },
      {
        type: 'cta',
        title: 'Pronto para começar?',
        text: 'Conte o que você precisa e receba os próximos passos.',
        label: 'Solicitar orçamento',
        href: '#contato',
      },
      {
        type: 'contact',
        title: 'Solicite seu orçamento',
        text:
          'Preencha os dados abaixo. A equipe responde pelo WhatsApp informado.',
      },
    ],
  },
  {
    slug: 'servicos',
    title: 'Serviços',
    seoTitle: 'Serviços de climatização',
    seoDescription:
      'Instalação, manutenção preventiva, higienização e infraestrutura para ar-condicionado.',
    sortOrder: 1,
    showInNav: true,
    blocks: [
      {
        type: 'text',
        title: 'Soluções para o seu ambiente',
        body:
          'Do reparo pontual ao acompanhamento preventivo. Cada serviço começa com uma conversa sobre o ambiente, o equipamento e o resultado esperado.',
      },
      {
        type: 'services',
        title: 'O que fazemos',
        items: [
          {
            title: 'Instalação',
            description:
              'Dimensionamento, suporte, tubulação e testes de funcionamento.',
          },
          {
            title: 'Manutenção preventiva',
            description:
              'Limpeza técnica, verificação de carga e checagem de componentes.',
          },
          {
            title: 'Higienização',
            description:
              'Remoção de sujeira e odores em evaporadora, filtros e dutos.',
          },
          {
            title: 'Infraestrutura',
            description:
              'Adequação elétrica e hidráulica para novas instalações.',
          },
        ],
      },
      {
        type: 'cta',
        title: 'Precisa de um diagnóstico?',
        text: 'Solicite uma avaliação inicial sem compromisso.',
        label: 'Falar com a equipe',
        href: '/contato',
      },
    ],
  },
  {
    slug: 'sobre',
    title: 'Sobre',
    seoTitle: 'Sobre a empresa',
    seoDescription:
      'Conheça a equipe e a forma de trabalho da empresa de climatização.',
    sortOrder: 2,
    showInNav: true,
    blocks: [
      {
        type: 'text',
        title: 'Quem somos',
        body:
          'Somos uma equipe de climatização focada em atendimento local, transparência e cuidado com cada ambiente. Trabalhamos com diagnóstico claro e comunicação direta.',
      },
      {
        type: 'text',
        title: 'Como trabalhamos',
        body:
          'Entendemos a necessidade, apresentamos uma estimativa, confirmamos o escopo e executamos o serviço com acompanhamento. O objetivo é que você saiba o que esperar em cada etapa.',
      },
      {
        type: 'cta',
        title: 'Vamos conversar?',
        text: 'Tire dúvidas ou peça uma avaliação.',
        label: 'Entrar em contato',
        href: '/contato',
      },
    ],
  },
  {
    slug: 'faq',
    title: 'Perguntas frequentes',
    seoTitle: 'Perguntas frequentes',
    seoDescription:
      'Dúvidas comuns sobre instalação, manutenção e atendimento de ar-condicionado.',
    sortOrder: 3,
    showInNav: true,
    blocks: [
      {
        type: 'faq',
        title: 'Perguntas frequentes',
        text: 'Se a sua dúvida não estiver aqui, fale com a equipe.',
      },
    ],
  },
  {
    slug: 'contato',
    title: 'Contato',
    seoTitle: 'Solicite um orçamento',
    seoDescription:
      'Envie os dados do seu ambiente e receba uma estimativa inicial.',
    sortOrder: 4,
    showInNav: true,
    blocks: [
      {
        type: 'contact',
        title: 'Solicite seu orçamento',
        text:
          'Preencha os dados abaixo. A equipe responde pelo WhatsApp informado.',
      },
    ],
  },
] as const;

const defaultFaq = [
  {
    question: 'Vocês atendem qual região?',
    answer:
      'O atendimento é local. Informe sua cidade e bairro no formulário para confirmarmos a disponibilidade.',
  },
  {
    question: 'O orçamento é gratuito?',
    answer:
      'A estimativa inicial é gratuita. Serviços que exigem visita técnica têm o escopo e a taxa informados antes.',
  },
  {
    question: 'Quanto tempo leva a instalação?',
    answer:
      'Depende do tipo de equipamento e da infraestrutura do local. A previsão é confirmada após a avaliação.',
  },
  {
    question: 'Como funciona a manutenção preventiva?',
    answer:
      'A equipe agenda uma revisão periódica, limpa os componentes e verifica o funcionamento do equipamento.',
  },
];

const defaultLegal = [
  {
    slug: 'privacidade',
    title: 'Política de Privacidade',
    body: `Esta política descreve como os dados enviados pelo site são utilizados para responder solicitações de orçamento e prestar os serviços contratados.

Dados coletados: nome, WhatsApp, e-mail opcional, cidade, bairro, tipo de serviço, quantidade de equipamentos, BTU opcional e observações. Também registramos data, IP e navegador do envio para segurança e comprovação do consentimento.

Finalidade: responder à solicitação, elaborar orçamento, agendar atendimento e manter histórico de atendimento. Os dados não são vendidos.

Retenção: leads não convertidos são mantidos por até 12 meses, salvo obrigação legal ou solicitação de exclusão.

Direitos: você pode solicitar acesso, correção ou exclusão dos seus dados pelo canal de contato da empresa.

Texto inicial sujeito a revisão jurídica antes do uso em produção.`,
  },
  {
    slug: 'termos',
    title: 'Termos de Uso',
    body: `Este site permite solicitar informações e orçamentos de serviços de climatização.

As estimativas apresentadas são referências iniciais e não substituem a avaliação técnica. O valor final depende das condições do local, do equipamento e do escopo confirmado.

O envio do formulário não cria contrato de prestação de serviço. O atendimento é confirmado pela empresa após contato e alinhamento do escopo.

Texto inicial sujeito a revisão jurídica antes do uso em produção.`,
  },
] as const;

const tenants = [
  {
    slug: 'demo',
    name: 'Clima Demo',
    hosts: ['localhost', 'demo.lvh.me'],
    users: [
      { email: 'admin@demo.test', name: 'Admin Demo', role: 'ADMIN' as const },
      {
        email: 'instalador@demo.test',
        name: 'Instalador Demo',
        role: 'INSTALLER' as const,
      },
    ],
  },
  {
    slug: 'demo2',
    name: 'Clima Demo Dois',
    hosts: ['demo2.lvh.me'],
    users: [
      {
        email: 'admin@demo2.test',
        name: 'Admin Demo Dois',
        role: 'ADMIN' as const,
      },
      {
        email: 'instalador@demo2.test',
        name: 'Instalador Demo Dois',
        role: 'INSTALLER' as const,
      },
    ],
  },
];

async function main() {
  const passwordHash = await hash(PASSWORD);

  for (const definition of tenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: definition.slug },
      update: { name: definition.name },
      create: { slug: definition.slug, name: definition.name },
    });

    await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        senderName: definition.name,
        replyToEmail: `contato@${definition.slug}.test`,
        siteTitle: `${definition.name} — Climatização`,
        siteDescription:
          'Instalação, manutenção e higienização de ar-condicionado com atendimento local.',
        phone: '(00) 00000-0000',
        whatsapp: '5500000000000',
        contactEmail: `contato@${definition.slug}.test`,
        address: 'Atendimento local',
        serviceAreas: ['Cidade e região'],
        whatsappMessage:
          'Olá! Gostaria de solicitar um orçamento de ar-condicionado.',
        primaryColor: '#0b6e99',
        secondaryColor: '#1a7f4b',
      },
    });

    for (const [index, host] of definition.hosts.entries()) {
      await prisma.tenantDomain.upsert({
        where: { host },
        update: { tenantId: tenant.id, isPrimary: index === 0 },
        create: { tenantId: tenant.id, host, isPrimary: index === 0 },
      });
    }

    for (const userDefinition of definition.users) {
      const user = await prisma.user.upsert({
        where: { email: userDefinition.email },
        update: { name: userDefinition.name, passwordHash },
        create: {
          email: userDefinition.email,
          name: userDefinition.name,
          passwordHash,
        },
      });

      await prisma.membership.upsert({
        where: {
          tenantId_userId: { tenantId: tenant.id, userId: user.id },
        },
        update: { role: userDefinition.role, active: true },
        create: {
          tenantId: tenant.id,
          userId: user.id,
          role: userDefinition.role,
        },
      });
    }

    for (const definition of defaultPages) {
      const page = await prisma.cmsPage.upsert({
        where: {
          tenantId_slug: { tenantId: tenant.id, slug: definition.slug },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          slug: definition.slug,
          title: definition.title,
          seoTitle: definition.seoTitle,
          seoDescription: definition.seoDescription,
          draftBlocks: definition.blocks,
          sortOrder: definition.sortOrder,
          showInNav: definition.showInNav,
          isSystem: true,
        },
      });

      if (!page.publishedVersionId) {
        const latest = await prisma.cmsVersion.findFirst({
          where: { tenantId: tenant.id, pageId: page.id },
          orderBy: { version: 'desc' },
          select: { version: true },
        });
        const version = await prisma.cmsVersion.create({
          data: {
            tenantId: tenant.id,
            pageId: page.id,
            version: (latest?.version ?? 0) + 1,
            title: page.title,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            blocks: page.draftBlocks as object,
          },
        });
        await prisma.cmsPage.update({
          where: { id: page.id },
          data: {
            publishedVersionId: version.id,
            publishedAt: new Date(),
          },
        });
      }
    }

    for (const [index, item] of defaultFaq.entries()) {
      await prisma.faqItem.upsert({
        where: {
          tenantId_question: { tenantId: tenant.id, question: item.question },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          question: item.question,
          answer: item.answer,
          sortOrder: index,
        },
      });
    }

    for (const document of defaultLegal) {
      await prisma.legalDocument.upsert({
        where: {
          tenantId_slug_version: {
            tenantId: tenant.id,
            slug: document.slug,
            version: 1,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          slug: document.slug,
          version: 1,
          title: document.title,
          body: document.body,
        },
      });
    }

    for (const key of ['quote', 'work_order', 'lead']) {
      await prisma.tenantCounter.upsert({
        where: { tenantId_key: { tenantId: tenant.id, key } },
        update: {},
        create: { tenantId: tenant.id, key },
      });
    }
  }

  console.log('Seed concluído.');
  console.log(`Usuários (senha: ${PASSWORD}):`);
  for (const tenant of tenants) {
    for (const user of tenant.users) {
      console.log(`- ${user.email} (${user.role}, ${tenant.slug})`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
