import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class SearchUsersByCodesDto {
    @ApiProperty({ example: ['SE001', 'SE002'] })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    codes: string[];
}
