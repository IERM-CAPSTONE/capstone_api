import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum, IsBoolean, IsDateString, IsString } from 'class-validator';

export class UpdateStudentExamDto {
    @ApiProperty({ example: '1', description: 'Seat number (ordered list)', required: false, nullable: true })
    @IsOptional()
    @IsString()
    seatNumber?: string | null;

    @ApiProperty({ description: 'Seat position ID (ExamSeat.id)', required: false, nullable: true })
    @IsOptional()
    @IsString()
    seatPosition?: string | null;
}
