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
