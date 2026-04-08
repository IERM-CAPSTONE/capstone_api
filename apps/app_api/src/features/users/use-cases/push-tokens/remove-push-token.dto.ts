import { IsOptional, IsString, MinLength } from 'class-validator';

export class RemovePushTokenDto {
    @IsOptional()
    @IsString()
    @MinLength(8)
    token?: string;

    @IsOptional()
    @IsString()
    deviceId?: string;
}
