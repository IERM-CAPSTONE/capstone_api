/**
 * Queue Names - Định nghĩa tên các queue
 */
export const QUEUE_NAMES = {
    /** Queue xử lý user */
    USER: 'user_queue',

    /** Queue nhận các event cho API */
    API_EVENT: 'api_event_queue',

    /** Queue xử lý exam */
    EXAM: 'exam_queue',
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
        /** Thông báo có một activity mới giúp đồng bộ real-time */
        ACTIVITY_LOGGED: 'user.activity.logged',
    },
    // Exam Patterns
    EXAM: {
        /** Import danh sách phòng thi */
        IMPORT_ROOMS: 'exam.import.rooms',
        /** Import lịch thi và sinh viên */
        IMPORT_SCHEDULE: 'exam.import.schedule',
        /** Import lịch thi */
        IMPORT_SESSION: 'exam.import.session',
        /** Import danh sách giám thị */
        IMPORT_PROCTORS: 'exam.import.proctors',
        /** Import mã đề và mã mở đề */
        IMPORT_EXAMCODE: 'exam.import.examcode',
        /** Thông báo import hoàn tất */
        IMPORT_FINISHED: 'exam.import.finished',
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
    EXAM_SERVICE: 'EXAM_SERVICE',
} as const;
