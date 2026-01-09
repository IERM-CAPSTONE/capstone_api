/**
 * Queue Names - Định nghĩa tên các queue
 */
export const QUEUE_NAMES = {
    /** Queue xử lý user */
    USER: 'user_queue',

    /** Queue nhận các event cho API */
    API_EVENT: 'api_event_queue',
} as const;

/**
 * Message Patterns - Định nghĩa các message patterns cho RabbitMQ
 */
export const MESSAGE_PATTERNS = {
    // User Patterns
    USER: {
        /** Import danh sách sinh viên */
        IMPORT_STUDENTS: 'user.import.students',
        /** Thông báo import hoàn tất */
        IMPORT_FINISHED: 'user.import.finished',
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
    USER_SERVICE: 'USER_SERVICE',
    API_EVENT_SERVICE: 'API_EVENT_SERVICE',
} as const;
