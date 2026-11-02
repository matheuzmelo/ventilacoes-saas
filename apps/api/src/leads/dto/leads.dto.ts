import { Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { LEAD_STATUSES } from '@vs/shared';

export class CreateLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @Matches(/^[+0-9()\-\s]{8,24}$/, {
    message: 'whatsapp deve conter apenas números, espaços, parênteses e hífen',
  })
  whatsapp!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  neighborhood?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  serviceType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  equipmentCount!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1_000)
  @Max(120_000)
  btu?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  notes?: string;

  @IsBoolean()
  @Equals(true, { message: 'É necessário aceitar a política de privacidade' })
  consent!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @IsOptional()
  @IsObject()
  utm?: Record<string, unknown>;
}

export class UpdateLeadStatusDto {
  @IsIn([...LEAD_STATUSES])
  status!: (typeof LEAD_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  note?: string;
}

export class CreateLeadNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4_000)
  note!: string;
}

export class ListLeadsQueryDto {
  @IsOptional()
  @IsIn([...LEAD_STATUSES])
  status?: (typeof LEAD_STATUSES)[number];

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
