import { ListAllLogsEndpoint, ListAllLogsHandler } from './list-all-logs';
import { CreateAttendanceLogEndpoint, CreateAttendanceLogHandler } from './create-log';

export const attendanceLogEndpoints = [
    ListAllLogsEndpoint,
    CreateAttendanceLogEndpoint,
];

export const attendanceLogHandlers = [
    ListAllLogsHandler,
    CreateAttendanceLogHandler,
];
