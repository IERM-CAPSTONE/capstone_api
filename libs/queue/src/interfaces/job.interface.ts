/**
 * Interface cho Notification Job Data
 */
export interface NotificationJobData {
    /** ID người nhận */
    userId: string;

    /** Tiêu đề thông báo */
    title: string;

    /** Nội dung thông báo */
    body: string;

    /** Dữ liệu bổ sung */
    data?: Record<string, unknown>;

    /** Loại thông báo */
    type: 'push' | 'in-app' | 'both';
}

/**
 * Interface cho Email Job Data
 */
export interface EmailJobData {
    /** Email người nhận */
    to: string;

    /** Tiêu đề email */
    subject: string;

    /** Nội dung email (HTML) */
    html?: string;

    /** Nội dung email (plain text) */
    text?: string;

    /** Template ID (nếu dùng email template) */
    templateId?: string;

    /** Dữ liệu cho template */
    templateData?: Record<string, unknown>;
}

/**
 * Interface cho User Import Job Data
 */
export interface UserImportJobData {
    /** Tên file */
    fileName: string;

    /** Nội dung file dưới dạng base64 */
    fileContent: string;

    /** Mime type */
    mimeType: string;
}

/**
 * Interface cho kết quả import hoàn tất
 */
export interface UserImportFinishedData {
    fileName: string;
    successCount: number;
    errorCount: number;
    failedItems?: any[];
    batchId?: string;
    timestamp: Date;
}

/**
 * Interface cho Exam Import Job Data
 */
export interface ExamImportJobData {
    /** Tên file */
    fileName: string;

    /** Nội dung file dưới dạng base64 */
    fileContent: string;

    /** Mime type */
    mimeType: string;

    /** Semester ID (optional) */
    semesterId?: string;

    /** Campus ID (optional) */
    campusId?: string;
}

export interface ExamImportFinishedData {
    action: 'rooms' | 'schedule' | 'proctor' | 'examcode' | 'subjects';
    fileName?: string;
    successCount: number;
    errorCount: number;
    failedItems?: { item: any; error: string }[];
    batchId?: string;
    timestamp: Date;
}

/**
 * Interface cho dữ liệu Import Schedule từ API
 */
export interface ScheduleImportData {
    examCode?: string | null;
    openCode?: string | null;
    subjectCode: string;
    examDate: string;
    startTime: string;
    endTime: string;
    room: string;
    examSession: string;
}

export interface StudentImportData {
    stt?: number | null;
    studentCode: string;
    name: string;
    email?: string | null;
    username?: string | null;
    memberCode?: string | null;
    examSession?: string | null;
    subjectCode: string;
    examPart: string;
}

export interface ProctorImportData {
    dateExam: string;
    timeExam: string;
    examRoom: string;
    proctorEmail: string;
    proctorType?: string;
}

export interface ImportScheduleJobData {
    importType: 'schedule';
    schedules: ScheduleImportData[];
    students: StudentImportData[];
    batchId?: string;
    totalItems?: number;
}

export interface ImportProctorJobData {
    importType: 'proctor';
    proctors: ProctorImportData[];
    creatorId?: string;
    batchId?: string;
    totalItems?: number;
}

export interface ExamCodeImportData {
    dateExam: string;
    timeExam: string;
    examRoom: string;
    subjectCode?: string;
    examCode?: string | null;
    openCode?: string | null;
}

export interface ImportExamCodeJobData {
    importType: 'examcode';
    codes: ExamCodeImportData[];
    batchId?: string;
    totalItems?: number;
}

/**
 * Base interface cho tất cả job results
 */
export interface BaseJobResult {
    /** Job ID */
    jobId: string;

    /** Trạng thái thành công */
    success: boolean;

    /** Thời gian xử lý (ms) */
    processingTime: number;

    /** Lỗi nếu có */
    error?: string;

    /** Thời gian hoàn thành */
    completedAt: Date;
}

/**
 * RabbitMQ Message Wrapper
 */
export interface RabbitMQMessage<T = unknown> {
    /** Message pattern */
    pattern: string;

    /** Message data */
    data: T;

    /** Correlation ID for tracking */
    correlationId?: string;

    /** Timestamp */
    timestamp: Date;
}
