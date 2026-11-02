import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { PERMISSIONS, type AuthUser } from '@vs/shared';
import { CurrentUser } from '../common/current-user.decorator';
import { RequirePermissions } from '../common/permissions.decorator';
import { getCorrelationId } from '../common/request-context';
import { CmsService } from './cms.service';
import {
  CreateCmsPageDto,
  CreateFaqItemDto,
  CreateLegalVersionDto,
  RevertCmsPageDto,
  UpdateCmsPageDto,
  UpdateFaqItemDto,
} from './dto/cms.dto';

@Controller('v1/cms')
@RequirePermissions(PERMISSIONS.CMS_MANAGE)
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  @Get('pages')
  listPages(@CurrentUser() user: AuthUser) {
    return this.cms.listPages(user.tenantId);
  }

  @Post('pages')
  createPage(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateCmsPageDto,
    @Req() request: Request,
  ) {
    return this.cms.createPage(
      user.tenantId,
      user.id,
      body,
      getCorrelationId(request),
    );
  }

  @Get('pages/:slug')
  getPage(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    return this.cms.getPage(user.tenantId, slug);
  }

  @Put('pages/:slug/draft')
  updateDraft(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Body() body: UpdateCmsPageDto,
    @Req() request: Request,
  ) {
    return this.cms.updateDraft(
      user.tenantId,
      slug,
      user.id,
      body,
      getCorrelationId(request),
    );
  }

  @Post('pages/:slug/publish')
  publish(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Req() request: Request,
  ) {
    return this.cms.publish(
      user.tenantId,
      slug,
      user.id,
      getCorrelationId(request),
    );
  }

  @Post('pages/:slug/revert')
  revert(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Body() body: RevertCmsPageDto,
    @Req() request: Request,
  ) {
    return this.cms.revert(
      user.tenantId,
      slug,
      body.versionId,
      user.id,
      getCorrelationId(request),
    );
  }

  @Get('faq')
  listFaq(@CurrentUser() user: AuthUser) {
    return this.cms.listFaq(user.tenantId);
  }

  @Post('faq')
  createFaq(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateFaqItemDto,
    @Req() request: Request,
  ) {
    return this.cms.createFaq(
      user.tenantId,
      user.id,
      body,
      getCorrelationId(request),
    );
  }

  @Patch('faq/:id')
  updateFaq(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateFaqItemDto,
    @Req() request: Request,
  ) {
    return this.cms.updateFaq(
      user.tenantId,
      id,
      user.id,
      body,
      getCorrelationId(request),
    );
  }

  @Delete('faq/:id')
  async deleteFaq(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Req() request: Request,
  ) {
    await this.cms.deleteFaq(
      user.tenantId,
      id,
      user.id,
      getCorrelationId(request),
    );
    return { deleted: true };
  }

  @Get('legal')
  listLegal(@CurrentUser() user: AuthUser) {
    return this.cms.listLegal(user.tenantId);
  }

  @Post('legal/:slug/versions')
  createLegalVersion(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Body() body: CreateLegalVersionDto,
    @Req() request: Request,
  ) {
    return this.cms.createLegalVersion(
      user.tenantId,
      slug,
      user.id,
      body,
      getCorrelationId(request),
    );
  }
}
