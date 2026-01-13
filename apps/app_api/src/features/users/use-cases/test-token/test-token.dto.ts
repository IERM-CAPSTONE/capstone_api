import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { RoleType } from '@app/users';

export class TestTokenDto {
    @ApiProperty({ enum: RoleType, default: RoleType.ADMIN })
    @IsEnum(RoleType)
    role: RoleType;

    @ApiProperty({ description: 'User ID (UUID)', required: false })
    @IsString()
    @IsOptional()
    userId?: string;
}
