/**
 * ExamTime Value Object
 * Handles open and close time logic
 */
export class ExamTime {
    constructor(
        public readonly openTime: Date | null,
        public readonly closeTime: Date | null,
    ) {
        if (openTime && closeTime && openTime >= closeTime) {
            throw new Error('Open time must be before close time');
        }
    }

    static create(openTime?: Date | string | null, closeTime?: Date | string | null): ExamTime {
        const start = openTime ? new Date(openTime) : null;
        const end = closeTime ? new Date(closeTime) : null;

        if (start && isNaN(start.getTime())) throw new Error('Invalid open time');
        if (end && isNaN(end.getTime())) throw new Error('Invalid close time');

        return new ExamTime(start, end);
    }
}
