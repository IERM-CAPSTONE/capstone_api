import { Test, TestingModule } from '@nestjs/testing';
import { CreateTicketHandler } from './create-ticket.handler';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';
import { PrismaService } from '@app/prisma';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';
import { IssueTypeEnum, PriorityEnum } from './create-ticket.dto';

describe('CreateTicketHandler', () => {
    let handler: CreateTicketHandler;
    let ticketRepo: jest.Mocked<ITicketRepository>;
    let prisma: any;
    let gateway: any;

    const REPORTER_ID = 'reporter-001';
    const baseDto = { issueName: 'Suspected Cheating', issueType: IssueTypeEnum.ACADEMIC_VIOLATION, description: 'Desc', priority: PriorityEnum.HIGH, sessionId: 'sess-001', attachment: 'https://img.jpg', studentCode: 'SE140001' };
    const savedTicket = { id: 'ticket-001', ...baseDto, status: 'OPEN', reporterId: REPORTER_ID, createdAt: new Date() };
    const reporter = { fullName: 'Nguyen Van A', role: 'PROCTOR' };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateTicketHandler,
                { provide: TICKET_REPOSITORY, useValue: { save: jest.fn(), findById: jest.fn(), findMany: jest.fn() } },
                { provide: PrismaService, useValue: { user: { findUnique: jest.fn(), findMany: jest.fn() }, notification: { createMany: jest.fn() } } },
                { provide: NotificationGateway, useValue: { sendToAll: jest.fn(), sendToUser: jest.fn() } },
            ],
        }).compile();
        handler = module.get(CreateTicketHandler);
        ticketRepo = module.get(TICKET_REPOSITORY);
        prisma = module.get(PrismaService);
        gateway = module.get(NotificationGateway);
    });

    // UTC01 - Normal: all fields
    it('UTC01: should save ticket with all fields and notify officers', async () => {
        ticketRepo.save.mockResolvedValue(savedTicket);
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([{ id: 'off-1' }, { id: 'off-2' }]);
        prisma.notification.createMany.mockResolvedValue({ count: 2 });
        const result = await handler.execute(baseDto, REPORTER_ID);
        expect(result).toEqual(savedTicket);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'OPEN', issueName: baseDto.issueName }));
        expect(gateway.sendToAll).toHaveBeenCalledWith('ticket:created', { ticket: savedTicket, reporter });
        expect(prisma.notification.createMany).toHaveBeenCalled();
        expect(prisma.notification.createMany.mock.calls[0][0].data).toHaveLength(2);
    });

    // UTC02 - Normal: required fields only
    it('UTC02: should default priority to Medium when not provided', async () => {
        const dto = { issueName: 'Room Too Hot', issueType: IssueTypeEnum.ROOM_MANAGEMENT };
        ticketRepo.save.mockImplementation(async (d) => ({ ...d, id: 'new-id' }));
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute(dto as any, REPORTER_ID);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ priority: 'Medium' }));
    });

    // UTC03 - Normal: each IssueType
    it.each([IssueTypeEnum.ACADEMIC_VIOLATION, IssueTypeEnum.TECHNICAL_ISSUE, IssueTypeEnum.ROOM_MANAGEMENT, IssueTypeEnum.FACE_MISMATCH])('UTC03: should accept issueType = %s', async (issueType) => {
        ticketRepo.save.mockImplementation(async (d) => ({ ...d, id: 'new-id' }));
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute({ ...baseDto, issueType }, REPORTER_ID);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ issueType }));
    });

    // UTC04 - Normal: each Priority
    it.each([PriorityEnum.LOW, PriorityEnum.MEDIUM, PriorityEnum.HIGH, PriorityEnum.URGENT])('UTC04: should accept priority = %s', async (priority) => {
        ticketRepo.save.mockImplementation(async (d) => ({ ...d, id: 'new-id' }));
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute({ ...baseDto, priority }, REPORTER_ID);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ priority }));
    });

    // UTC05 - Normal: no exam officers
    it('UTC05: should skip notification when no exam officers exist', async () => {
        ticketRepo.save.mockResolvedValue(savedTicket);
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute(baseDto, REPORTER_ID);
        expect(prisma.notification.createMany).not.toHaveBeenCalled();
        expect(gateway.sendToAll).toHaveBeenCalled();
    });

    // UTC06 - Normal: reporter not found
    it('UTC06: should use null reporter and fallback name', async () => {
        ticketRepo.save.mockResolvedValue(savedTicket);
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.findMany.mockResolvedValue([{ id: 'off-1' }]);
        prisma.notification.createMany.mockResolvedValue({ count: 1 });
        await handler.execute(baseDto, REPORTER_ID);
        expect(gateway.sendToAll).toHaveBeenCalledWith('ticket:created', { ticket: savedTicket, reporter: null });
        const msg = prisma.notification.createMany.mock.calls[0][0].data[0].message;
        expect(msg).toContain('Giám thị');
    });

    // UTC07 - Abnormal: repo save error
    it('UTC07: should propagate repository save error', async () => {
        ticketRepo.save.mockRejectedValue(new Error('DB connection failed'));
        await expect(handler.execute(baseDto, REPORTER_ID)).rejects.toThrow('DB connection failed');
        expect(gateway.sendToAll).not.toHaveBeenCalled();
    });

    // UTC08 - Abnormal: notification error
    it('UTC08: should propagate notification error', async () => {
        ticketRepo.save.mockResolvedValue(savedTicket);
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([{ id: 'off-1' }]);
        prisma.notification.createMany.mockRejectedValue(new Error('Notification DB Error'));
        await expect(handler.execute(baseDto, REPORTER_ID)).rejects.toThrow('Notification DB Error');
    });

    // UTC09 - Boundary: empty issueName
    it('UTC09: should pass empty issueName through', async () => {
        ticketRepo.save.mockImplementation(async (d) => ({ ...d, id: 'new-id' }));
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute({ ...baseDto, issueName: '' }, REPORTER_ID);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ issueName: '' }));
    });

    // UTC10 - Boundary: long description
    it('UTC10: should pass very long description without truncation', async () => {
        const long = 'A'.repeat(5000);
        ticketRepo.save.mockImplementation(async (d) => ({ ...d, id: 'new-id' }));
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute({ ...baseDto, description: long }, REPORTER_ID);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ description: long }));
    });

    // UTC11 - Boundary: notification content
    it('UTC11: should include correct content in notification', async () => {
        ticketRepo.save.mockResolvedValue(savedTicket);
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([{ id: 'off-1' }]);
        prisma.notification.createMany.mockResolvedValue({ count: 1 });
        await handler.execute(baseDto, REPORTER_ID);
        const n = prisma.notification.createMany.mock.calls[0][0].data[0];
        expect(n.title).toContain(baseDto.issueName);
        expect(n.message).toContain(reporter.fullName);
        expect(n.meta.issueType).toBe(baseDto.issueType);
    });

    // UTC12 - Boundary: status always OPEN
    it('UTC12: should always set status to OPEN', async () => {
        ticketRepo.save.mockImplementation(async (d) => ({ ...d, id: 'new-id' }));
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute(baseDto, REPORTER_ID);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'OPEN' }));
    });
});
