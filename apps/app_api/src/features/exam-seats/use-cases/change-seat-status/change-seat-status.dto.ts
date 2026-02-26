import { IsEnum, IsString } from 'class-validator';

export class ChangeExamSeatStatusDto {
    @IsString()
    id: string;

    @IsEnum(['Available', 'Locked', 'Assigned', 'Present', 'Absent'])
    status: 'Available' | 'Locked' | 'Assigned' | 'Present' | 'Absent';
}
