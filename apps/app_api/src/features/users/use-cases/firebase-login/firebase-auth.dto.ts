import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FirebaseAuthDto {
    @ApiProperty({
        description: 'Firebase ID Token from client',
        example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6I...'
    })
    @IsNotEmpty()
    @IsString()
    idToken: string;
}

export class AuthResponseDto {
    @ApiProperty({
        description: 'Access token for API calls',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    accessToken: string;

    @ApiProperty({
        description: 'Refresh token for token renewal',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    refreshToken: string;

    @ApiProperty({
        description: 'Authenticated user info',
        example: {
            id: 'user-123',
            email: 'user@example.com',
            fullName: 'John Doe',
            role: 'student'
        }
    })
    user: {
        id: string;
        email: string;
        fullName: string;
        role: string;
        code: string;
        avatarUrl: string;
    };

    @ApiProperty({
        description: 'Success message',
        example: 'Successfully authenticated with Firebase'
    })
    message: string;
}
