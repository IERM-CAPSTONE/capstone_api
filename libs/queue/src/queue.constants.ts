/**
 * Queue Names - Định nghĩa tên các queue
 */
export const QUEUE_NAMES = {
    /** Queue gửi notifications */
    NOTIFICATION: 'notification_queue',

    /** Queue xử lý email */
    EMAIL: 'email_queue',
} as const;

/**
 * Message Patterns - Định nghĩa các message patterns cho RabbitMQ
 */
export const MESSAGE_PATTERNS = {
    // Notification Patterns
    NOTIFICATION: {
        /** Gửi push notification */
        SEND_PUSH: 'notification.send.push',
        /** Gửi in-app notification */
        SEND_IN_APP: 'notification.send.in-app',
    },

    // Email Patterns
    EMAIL: {
        /** Gửi email xác nhận */
        SEND_CONFIRMATION: 'email.send.confirmation',
        /** Gửi email thông báo */
        SEND_ALERT: 'email.send.alert',
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

    /** Thời gian timeout cho mỗi job (ms) */
    JOB_TIMEOUT: 30000,

    /** Prefetch count - số message consumer lấy cùng lúc */
    PREFETCH_COUNT: 1,

    /** Queue durable - queue tồn tại sau khi broker restart */
    DURABLE: true,

    /** Message persistent - message được lưu vào disk */
    PERSISTENT: true,
};

/**
 * RabbitMQ Client Names - Tên các client inject
 */
export const RABBITMQ_CLIENTS = {
    NOTIFICATION_SERVICE: 'NOTIFICATION_SERVICE',
    EMAIL_SERVICE: 'EMAIL_SERVICE',
} as const;
