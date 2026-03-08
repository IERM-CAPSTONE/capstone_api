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

    @ApiProperty({ example: '1', description: 'Seat number (ordered list)', required: false, nullable: true })
    @IsOptional()
    @IsString()
    seatNumber?: string | null;

    @ApiProperty({ description: 'Seat position ID (ExamSeat.id)', required: false, nullable: true })
    @IsOptional()
    @IsString()
    seatPosition?: string | null;
}
