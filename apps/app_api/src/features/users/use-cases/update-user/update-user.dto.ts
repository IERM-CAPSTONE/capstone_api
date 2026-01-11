/**
 * Update User - Request DTO
 */
import { IsEmail, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { RoleType } from '@app/users';

export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
    email?: string;

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
