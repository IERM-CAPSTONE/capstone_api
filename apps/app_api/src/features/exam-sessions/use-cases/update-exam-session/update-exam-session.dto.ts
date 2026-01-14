import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateExamSessionDto {
    @ApiProperty({ required: false, nullable: true })
    examRoomId?: string | null;

    @ApiProperty({ required: false, nullable: true })
    proctorId?: string | null;

    @ApiProperty({ required: false, nullable: true })
    hallInvigilatorId?: string | null;

    @ApiProperty({ required: false, nullable: true })
    subjectCode?: string | null;

    @ApiProperty({ required: false, nullable: true })
    examOpenTime?: Date | null;

    @ApiProperty({ required: false, nullable: true })
    examCloseTime?: Date | null;

    @ApiProperty({ example: 'Scheduled', enum: ['Ongoing', 'Ended', 'Scheduled'], description: 'Session status', required: false })
    @IsOptional()
    @IsEnum(['Ongoing', 'Ended', 'Scheduled'])
    status?: string;
}
