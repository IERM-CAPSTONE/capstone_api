import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum, IsBoolean, IsDateString, IsString } from 'class-validator';

export class UpdateStudentExamDto {
    @ApiProperty({ example: 1, description: 'Seat number', required: false, nullable: true })
    @IsOptional()
    @IsInt()
    seatNumber?: number | null;

    @ApiProperty({ example: 'CHECKEDIN', enum: ['REGISTERED', 'CHECKEDIN', 'CHECKEDOUT', 'MOVED', 'REMOVED'], required: false })
    @IsOptional()
    @IsEnum(['REGISTERED', 'CHECKEDIN', 'CHECKEDOUT', 'MOVED', 'REMOVED'])
    status?: string;

    @ApiProperty({ example: 'Room A1', description: 'Current location', required: false, nullable: true })
    @IsOptional()
    @IsString()
    currentLocation?: string | null;

    @ApiProperty({ description: 'Identity ID', required: false, nullable: true })
    @IsOptional()
    @IsString()
    identityId?: string | null;

    @ApiProperty({ example: true, description: 'Identity match status', required: false })
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
