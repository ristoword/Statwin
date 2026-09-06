import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, SubscriptionPlan } from '@prisma/client';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAdminUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @ApiProperty({ enum: ['FREE', 'PREMIUM', 'PRO'] })
  @IsIn(['FREE', 'PREMIUM', 'PRO'])
  plan!: SubscriptionPlan;

  @ApiPropertyOptional({ enum: ['USER', 'PREMIUM_USER', 'ADMIN'] })
  @IsOptional()
  @IsIn(['USER', 'PREMIUM_USER', 'ADMIN'])
  role?: Role;
}
