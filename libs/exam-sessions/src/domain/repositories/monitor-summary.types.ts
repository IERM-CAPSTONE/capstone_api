import { ExamSessionStatus } from '@prisma/client';

export interface SessionRoomDetail {
    sessionId: string;
    roomNumber: string;
    proctorName: string | null;
    proctorOnline: boolean;
    hallInvigilatorName: string | null;
    hallInvigilatorOnline: boolean;
    checkedIn: number;
    totalStudents: number;
    pendingTickets: number;
}

export interface SubjectMonitorSummary {
    subjectCode: string;
    examOpenTime: Date;
    examCloseTime: Date;
    status: ExamSessionStatus;
    totalProctors: number;
    presentProctors: number;
    totalHallInvigilators: number;
    presentHallInvigilators: number;
    totalStudents: number;
    checkedInStudents: number;
    pendingTickets: number;
    sessions: SessionRoomDetail[];
}
