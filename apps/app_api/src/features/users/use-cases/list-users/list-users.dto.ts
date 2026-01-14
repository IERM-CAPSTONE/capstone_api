import { Type, Transform, plainToInstance } from 'class-transformer';
import { IsOptional, IsInt, Min, IsEnum, IsBoolean, IsString } from 'class-validator';
import { RoleType } from '@app/users';

export class ListUsersDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number;

    @IsOptional()
    @IsEnum(RoleType)
    role?: RoleType;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') return undefined;
        if (value === 'true' || value === true || value === '1') return true;
        if (value === 'false' || value === false || value === '0') return false;
        return undefined;
    })
    isActive?: boolean;

    @IsOptional()
    @IsString()
    @Type(() => String)
    search?: string;
}
