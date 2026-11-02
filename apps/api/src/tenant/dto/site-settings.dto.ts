import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateSiteSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  siteTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  siteDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  logoUrl?: string;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'primaryColor deve estar no formato #RRGGBB',
  })
  primaryColor?: string;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, {
    message: 'secondaryColor deve estar no formato #RRGGBB',
  })
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  serviceAreas?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(600)
  whatsappMessage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  googleBusinessUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  senderName?: string;

  @IsOptional()
  @IsEmail()
  replyToEmail?: string;
}
