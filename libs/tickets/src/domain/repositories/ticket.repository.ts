export const TICKET_REPOSITORY = 'TICKET_REPOSITORY';

export interface ITicketRepository {
    save(ticket: any): Promise<any>;
    findById(id: string): Promise<any | null>;
    findMany(filters: {
        status?: string;
        reporterId?: string;
        assigneeId?: string;
        issueType?: string;
    }): Promise<any[]>;
}
