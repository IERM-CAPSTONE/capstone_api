import { ApiProperty } from '@nestjs/swagger';

export class ListExamSessionsDto {
    @ApiProperty({ required: false, default: 1 })
    page?: number;

    @ApiProperty({ required: false, default: 10 })
    limit?: number;

    @ApiProperty({ required: false })
    subjectCode?: string;

    @ApiProperty({ required: false })
    examRoomId?: string;

    @ApiProperty({ required: false })
    proctorId?: string;
}
