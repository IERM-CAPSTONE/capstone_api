import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { UpdateStudentExamPartDto } from './update-student-exam-part.dto';

@Injectable()
export class UpdateStudentExamPartHandler {
    constructor(private readonly prisma: PrismaService) { }

    async execute(id: string, dto: UpdateStudentExamPartDto) {
        const existing = await this.prisma.studentExamPart.findUnique({ where: { id } });

        if (!existing) {
            throw new NotFoundException(`StudentExamPart with id '${id}' not found`);
        }

        const updated = await this.prisma.studentExamPart.update({
            where: { id },
            data: {
                ...(dto.isCheckedIn !== undefined && { isCheckedIn: dto.isCheckedIn }),
                ...(dto.checkInTime !== undefined && { checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : null }),
                ...(dto.isSubmit !== undefined && { isSubmit: dto.isSubmit }),
                ...(dto.submitTime !== undefined && { submitTime: dto.submitTime ? new Date(dto.submitTime) : null }),
                ...(dto.isSign !== undefined && { isSign: dto.isSign }),
                ...(dto.signTime !== undefined && { signTime: dto.signTime ? new Date(dto.signTime) : null }),
            },
            include: {
                examPart: true,
            }
        });

        return {
            id: updated.id,
            studentExamId: updated.studentExamId,
            examPartId: updated.examPartId,
            examPartCode: (updated as any).examPart?.code,
            examPartName: (updated as any).examPart?.name,
            isCheckedIn: updated.isCheckedIn,
            checkInTime: updated.checkInTime,
            isSubmit: updated.isSubmit,
            submitTime: updated.submitTime,
            isSign: updated.isSign,
            signTime: updated.signTime,
        };
    }
}
