import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleIdTokenDto {
    @ApiProperty({
        example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImY4Z...',
        description: 'Google ID Token from client'
    })
    @IsNotEmpty()
    @IsString()
    idToken: string;
}
