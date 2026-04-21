export class ExamRoomNotFoundException extends Error {
    constructor(id: string) {
        super(`ExamRoom with id '${id}' not found`);
        this.name = 'ExamRoomNotFoundException';
    }
}

export class ExamRoomAlreadyExistsException extends Error {
    constructor(roomNumber: number) {
        super(`ExamRoom with room number '${roomNumber}' already exists`);
        this.name = 'ExamRoomAlreadyExistsException';
    }
}
