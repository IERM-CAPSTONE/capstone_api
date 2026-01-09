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
    timestamp: Date;
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
