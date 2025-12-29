/**
 * Queue Names - Định nghĩa tên các queue
 */
export const QUEUE_NAMES = {
    /** Queue gửi notifications */
    NOTIFICATION: 'notification',

    /** Queue xử lý email */
    EMAIL: 'email',
} as const;

/**
 * Job Names - Định nghĩa tên các job trong mỗi queue
 */
export const JOB_NAMES = {
    // Notification Jobs
    NOTIFICATION: {
        /** Gửi push notification */
        SEND_PUSH: 'send-push',
        /** Gửi in-app notification */
        SEND_IN_APP: 'send-in-app',
    },

    // Email Jobs
    EMAIL: {
        /** Gửi email xác nhận */
        SEND_CONFIRMATION: 'send-confirmation',
        /** Gửi email thông báo */
        SEND_ALERT: 'send-alert',
    },
} as const;

/**
 * Queue Options - Cấu hình mặc định cho các queue
 */
export const QUEUE_OPTIONS = {
    /** Số lần retry khi job fail */
    DEFAULT_ATTEMPTS: 3,

    /** Thời gian delay giữa các lần retry (ms) */
    BACKOFF_DELAY: 5000,

    /** Loại backoff strategy */
    BACKOFF_TYPE: 'exponential' as const,

    /** Thời gian timeout cho mỗi job (ms) */
    JOB_TIMEOUT: 30000,

    /** Xóa job sau khi hoàn thành */
    REMOVE_ON_COMPLETE: true,

    /** Giữ lại job khi fail để debug */
    REMOVE_ON_FAIL: false,
};
