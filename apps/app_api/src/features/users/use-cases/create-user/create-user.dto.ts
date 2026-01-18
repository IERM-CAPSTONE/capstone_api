import { Transform } from 'class-transformer';
import { RoleType } from '@app/users';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * Create User - Request DTO
 */
export class CreateUserDto {
    @IsOptional()
    @IsEmail()
    @Transform(({ value }) => value?.trim())
    email?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toLowerCase().trim())
    username?: string;

    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;

    @IsOptional()
    @IsEnum(RoleType)
    role?: RoleType;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
