import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

@Injectable()
export class ArchiveExamSessionHandler {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(id: string): Promise<any> {
    try {
      // Check if exam session exists
      const existingSession = await this.prismaService.examSession.findUnique({
        where: { id },
      });

      if (!existingSession) {
        throw new NotFoundException(`Exam session with id ${id} not found`);
      }

      // Allow archive if status is Ended OR the exam has already finished by time window
      const now = new Date();
      const hasEndedByTime =
        existingSession.examCloseTime && new Date(existingSession.examCloseTime) < now;

      if (existingSession.status !== 'Ended' && !hasEndedByTime) {
        throw new BadRequestException(
          `Cannot archive exam session with status "${existingSession.status}". Only ended/completed exams can be archived.`
        );
      }

      // Mark as archived (we keep status as Ended to respect enum)
      const archivedSession = await this.prismaService.examSession.update({
        where: { id },
        data: {
          status: 'Ended',
          isArchived: true,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          examCode: true,
          status: true,
          isArchived: true,
          examCloseTime: true,
          examOpenTime: true,
          subjectCode: true,
        },
      });

      return {
        ...archivedSession,
        message: 'Exam session archived successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to archive exam session: ${error.message}`);
    }
  }
}
