import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, IsEnum, IsBoolean, IsDateString } from 'class-validator';

export class CreateStudentExamDto {
    @ApiProperty({ description: 'Exam session ID' })
    @IsString()
    @IsNotEmpty()
    examSessionId: string;

    @ApiProperty({ description: 'Student user ID' })
    @IsString()
    @IsNotEmpty()
    studentId: string;

    @ApiProperty({ example: '1-1', description: 'Seat number', required: false, nullable: true })
    @IsOptional()
    @IsString()
    seatNumber?: string | null;

    @ApiProperty({ example: 'REGISTERED', enum: ['REGISTERED', 'CHECKEDIN', 'CHECKEDOUT', 'MOVED', 'REMOVED'], required: false })
    @IsOptional()
    @IsEnum(['REGISTERED', 'CHECKEDIN', 'CHECKEDOUT', 'MOVED', 'REMOVED'])
    status?: string;

    @ApiProperty({ example: 'Room A1', description: 'Current location', required: false, nullable: true })
    @IsOptional()
    @IsString()
    currentLocation?: string | null;

    @ApiProperty({ description: 'Identity ID for verification', required: false, nullable: true })
    @IsOptional()
    @IsString()
    identityId?: string | null;

    @ApiProperty({ example: false, description: 'Identity match status', required: false })
    @IsOptional()
    @IsBoolean()
    isMatched?: boolean;

    @ApiProperty({ example: '2026-01-20T08:00:00.000Z', description: 'Check-in time', required: false, nullable: true })
    @IsOptional()
    @IsDateString()
    checkinTime?: Date | null;

    @ApiProperty({ example: '2026-01-20T10:00:00.000Z', description: 'Check-out time', required: false, nullable: true })
    @IsOptional()
    @IsDateString()
    checkoutTime?: Date | null;

    @ApiProperty({ example: true, description: 'Validity status', required: false })
    @IsOptional()
    @IsBoolean()
    isValid?: boolean;
}
