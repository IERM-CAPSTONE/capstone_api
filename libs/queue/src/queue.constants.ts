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

    /** Queue xử lý face recognition */
    FACE_RECOGNITION: 'face_recognition_queue',
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
        /** Import danh sách môn học */
        IMPORT_SUBJECTS: 'exam.import.subjects',
        /** Tạo lịch thi tự động */
        AUTO_GENERATE_SCHEDULE: 'exam.auto_generate.schedule',
        /** Thông báo import hoàn tất */
        IMPORT_FINISHED: 'exam.import.finished',
        /** Thông báo tạo lịch tự động hoàn tất */
        AUTO_GENERATE_FINISHED: 'exam.auto_generate.finished',
        /** Thông báo thuật toán tạo lịch đã chạy xong */
        AUTO_GENERATE_CALCULATED: 'exam.auto_generate.calculated',
    },
    // Face Recognition Patterns
    FACE: {
        /** Đăng ký khuôn mặt */
        REGISTER: 'face.register',
        /** Xác thực khuôn mặt */
        AUTHENTICATE: 'face.authenticate',
        /** Kết quả xử lý từ Python worker */
        RESULT: 'face.result',
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
    FACE_RECOGNITION_SERVICE: 'FACE_RECOGNITION_SERVICE',
} as const;
