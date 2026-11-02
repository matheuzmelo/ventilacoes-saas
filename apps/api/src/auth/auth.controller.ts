import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { Public } from '../common/public.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import {
  getCorrelationId,
  type RequestWithContext,
} from '../common/request-context';
import type { AuthUser } from '@vs/shared';
import { AuthService, type TokenBundle } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

export const ACCESS_COOKIE = 'vs_access';
export const REFRESH_COOKIE = 'vs_refresh';

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() request: RequestWithContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: AuthUser }> {
    const result = await this.authService.login(
      dto,
      getCorrelationId(request),
    );
    this.setAuthCookies(response, result.tokens);
    return { user: result.user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body() dto: RefreshDto,
    @Req() request: RequestWithContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: AuthUser }> {
    const rawToken =
      dto.refreshToken ??
      (request.cookies?.[REFRESH_COOKIE] as string | undefined);
    const result = await this.authService.refresh(
      rawToken,
      getCorrelationId(request),
    );
    this.setAuthCookies(response, result.tokens);
    return { user: result.user };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(
    @Body() dto: RefreshDto,
    @Req() request: RequestWithContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ ok: true }> {
    const rawToken =
      dto.refreshToken ??
      (request.cookies?.[REFRESH_COOKIE] as string | undefined);
    await this.authService.logout(rawToken);
    response.clearCookie(ACCESS_COOKIE, { path: '/' });
    response.clearCookie(REFRESH_COOKIE, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): { user: AuthUser } {
    return { user };
  }

  private setAuthCookies(response: Response, tokens: TokenBundle): void {
    const secure = this.config.get<string>('NODE_ENV') === 'production';

    response.cookie(ACCESS_COOKIE, tokens.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: tokens.accessExpiresInSeconds * 1000,
    });

    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: tokens.refreshExpiresInSeconds * 1000,
    });
  }
}
