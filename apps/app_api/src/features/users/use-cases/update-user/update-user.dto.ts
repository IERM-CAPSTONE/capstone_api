/**
 * Update User - Request DTO
 */
import { IsEmail, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { RoleType } from '@app/users';

export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
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
