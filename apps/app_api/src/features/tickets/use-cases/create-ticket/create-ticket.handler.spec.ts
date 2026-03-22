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

    /** Returns a session mock whose time window always passes the handler's guard.
     *  Uses ±24h window to absorb the 7h UTC+7 timezone re-parsing in toVNDate(). */
    const mockSession = (campus: string | null = null) => ({
        examOpenTime: new Date(Date.now() - 24 * 60 * 60 * 1000),   // 24h ago
        examCloseTime: new Date(Date.now() + 24 * 60 * 60 * 1000),  // 24h from now
        campus,
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateTicketHandler,
                { provide: TICKET_REPOSITORY, useValue: { save: jest.fn(), findById: jest.fn(), findMany: jest.fn() } },
                {
                    provide: PrismaService,
                    useValue: {
                        examSession: { findUnique: jest.fn() },
                        user: { findUnique: jest.fn(), findMany: jest.fn() },
                        notification: { createMany: jest.fn() },
                    },
                },
                { provide: NotificationGateway, useValue: { sendToAll: jest.fn(), sendToUser: jest.fn(), sendToCampus: jest.fn() } },
            ],
        }).compile();
        handler = module.get(CreateTicketHandler);
        ticketRepo = module.get(TICKET_REPOSITORY);
        prisma = module.get(PrismaService);
        gateway = module.get(NotificationGateway);
    });

    // UTC01 - Normal: all fields
    it('UTC01: should save ticket with all fields and notify officers', async () => {
        prisma.examSession.findUnique.mockResolvedValue(mockSession());
        ticketRepo.save.mockResolvedValue(savedTicket);
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([{ id: 'off-1' }, { id: 'off-2' }]);
        prisma.notification.createMany.mockResolvedValue({ count: 2 });
        const result = await handler.execute(baseDto, REPORTER_ID);
        expect(result).toEqual(savedTicket);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'OPEN', issueName: baseDto.issueName }));
        expect(prisma.notification.createMany).toHaveBeenCalled();
        expect(prisma.notification.createMany.mock.calls[0][0].data).toHaveLength(2);
    });

    // UTC02 - Normal: required fields only
    it('UTC02: should default priority to Medium when not provided', async () => {
        const dto = { issueName: 'Room Too Hot', issueType: IssueTypeEnum.ROOM_MANAGEMENT, sessionId: 'sess-001' };
        prisma.examSession.findUnique.mockResolvedValue(mockSession());
        ticketRepo.save.mockImplementation(async (d) => ({ ...d, id: 'new-id' }));
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute(dto as any, REPORTER_ID);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ priority: 'Medium' }));
    });

    // UTC03 - Normal: each IssueType
    it.each([IssueTypeEnum.ACADEMIC_VIOLATION, IssueTypeEnum.TECHNICAL_ISSUE, IssueTypeEnum.ROOM_MANAGEMENT, IssueTypeEnum.FACE_MISMATCH])('UTC03: should accept issueType = %s', async (issueType) => {
        prisma.examSession.findUnique.mockResolvedValue(mockSession());
        ticketRepo.save.mockImplementation(async (d) => ({ ...d, id: 'new-id' }));
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute({ ...baseDto, issueType }, REPORTER_ID);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ issueType }));
    });

    // UTC04 - Normal: each Priority
    it.each([PriorityEnum.LOW, PriorityEnum.MEDIUM, PriorityEnum.HIGH, PriorityEnum.URGENT])('UTC04: should accept priority = %s', async (priority) => {
        prisma.examSession.findUnique.mockResolvedValue(mockSession());
        ticketRepo.save.mockImplementation(async (d) => ({ ...d, id: 'new-id' }));
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute({ ...baseDto, priority }, REPORTER_ID);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ priority }));
    });

    // UTC05 - Normal: no exam officers
    it('UTC05: should skip notification when no exam officers exist', async () => {
        prisma.examSession.findUnique.mockResolvedValue(mockSession());
        ticketRepo.save.mockResolvedValue(savedTicket);
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute(baseDto, REPORTER_ID);
        expect(prisma.notification.createMany).not.toHaveBeenCalled();
        // sendToAll called because mockSession() returns campus: null
        expect(gateway.sendToAll).toHaveBeenCalled();
    });

    // UTC06 - Normal: reporter not found
    it('UTC06: should use null reporter and fallback name', async () => {
        prisma.examSession.findUnique.mockResolvedValue(mockSession());
        ticketRepo.save.mockResolvedValue(savedTicket);
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.findMany.mockResolvedValue([{ id: 'off-1' }]);
        prisma.notification.createMany.mockResolvedValue({ count: 1 });
        await handler.execute(baseDto, REPORTER_ID);
        // campus null → sendToAll
        expect(gateway.sendToAll).toHaveBeenCalledWith('ticket:created', { ticket: savedTicket, reporter: null });
        const msg = prisma.notification.createMany.mock.calls[0][0].data[0].message;
        expect(msg).toContain('Giám thị');
    });

    // UTC07 - Abnormal: repo save error
    it('UTC07: should propagate repository save error', async () => {
        prisma.examSession.findUnique.mockResolvedValue(mockSession());
        ticketRepo.save.mockRejectedValue(new Error('DB connection failed'));
        await expect(handler.execute(baseDto, REPORTER_ID)).rejects.toThrow('DB connection failed');
        expect(gateway.sendToAll).not.toHaveBeenCalled();
    });

    // UTC08 - Abnormal: notification error
    it('UTC08: should propagate notification error', async () => {
        prisma.examSession.findUnique.mockResolvedValue(mockSession());
        ticketRepo.save.mockResolvedValue(savedTicket);
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([{ id: 'off-1' }]);
        prisma.notification.createMany.mockRejectedValue(new Error('Notification DB Error'));
        await expect(handler.execute(baseDto, REPORTER_ID)).rejects.toThrow('Notification DB Error');
    });

    // UTC09 - Boundary: empty issueName
    it('UTC09: should pass empty issueName through', async () => {
        prisma.examSession.findUnique.mockResolvedValue(mockSession());
        ticketRepo.save.mockImplementation(async (d) => ({ ...d, id: 'new-id' }));
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute({ ...baseDto, issueName: '' }, REPORTER_ID);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ issueName: '' }));
    });

    // UTC10 - Boundary: long description
    it('UTC10: should pass very long description without truncation', async () => {
        const long = 'A'.repeat(5000);
        prisma.examSession.findUnique.mockResolvedValue(mockSession());
        ticketRepo.save.mockImplementation(async (d) => ({ ...d, id: 'new-id' }));
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute({ ...baseDto, description: long }, REPORTER_ID);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ description: long }));
    });

    // UTC11 - Boundary: notification content
    it('UTC11: should include correct content in notification', async () => {
        prisma.examSession.findUnique.mockResolvedValue(mockSession());
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
        prisma.examSession.findUnique.mockResolvedValue(mockSession());
        ticketRepo.save.mockImplementation(async (d) => ({ ...d, id: 'new-id' }));
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([]);
        await handler.execute(baseDto, REPORTER_ID);
        expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'OPEN' }));
    });
    // UTC-C01 - Campus: session with DN campus → notify only DN officers + sendToCampus
    it('UTC-C01: should sendToCampus and filter officers by campus when session has campus', async () => {
        prisma.examSession.findUnique.mockResolvedValue(mockSession('DN'));
        ticketRepo.save.mockResolvedValue(savedTicket);
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([{ id: 'dn-officer-1' }]);
        prisma.notification.createMany.mockResolvedValue({ count: 1 });

        await handler.execute(baseDto, REPORTER_ID);

        // Should use sendToCampus, NOT sendToAll
        expect(gateway.sendToCampus).toHaveBeenCalledWith('DN', 'ticket:created', expect.objectContaining({ ticket: savedTicket }));
        expect(gateway.sendToAll).not.toHaveBeenCalled();

        // Should filter officers by campus DN
        expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ role: 'EXAM_OFFICER', campus: 'DN' }),
        }));
        expect(prisma.notification.createMany.mock.calls[0][0].data).toHaveLength(1);
    });

    // UTC-C02 - Campus: session with no campus → sendToAll fallback + notify all officers
    it('UTC-C02: should fallback to sendToAll and notify all officers when session has no campus', async () => {
        prisma.examSession.findUnique.mockResolvedValue(mockSession(null));
        ticketRepo.save.mockResolvedValue(savedTicket);
        prisma.user.findUnique.mockResolvedValue(reporter);
        prisma.user.findMany.mockResolvedValue([{ id: 'off-1' }, { id: 'off-2' }, { id: 'off-3' }]);
        prisma.notification.createMany.mockResolvedValue({ count: 3 });

        await handler.execute(baseDto, REPORTER_ID);

        // Should use sendToAll, NOT sendToCampus
        expect(gateway.sendToAll).toHaveBeenCalledWith('ticket:created', expect.objectContaining({ ticket: savedTicket }));
        expect(gateway.sendToCampus).not.toHaveBeenCalled();

        // Should NOT filter by campus (no campus field in where clause)
        expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { role: 'EXAM_OFFICER' },
        }));
    });

    // UTC-C03 - Campus: different campus officers not notified
    it('UTC-C03: should not include HN officers when session campus is DN', async () => {
        prisma.examSession.findUnique.mockResolvedValue(mockSession('DN'));
        ticketRepo.save.mockResolvedValue(savedTicket);
        prisma.user.findUnique.mockResolvedValue(reporter);
        // Simulate: only 1 DN officer returned (HN officers already filtered out by Prisma)
        prisma.user.findMany.mockResolvedValue([{ id: 'dn-officer-1' }]);
        prisma.notification.createMany.mockResolvedValue({ count: 1 });

        await handler.execute(baseDto, REPORTER_ID);

        expect(gateway.sendToCampus).toHaveBeenCalledWith('DN', 'ticket:created', expect.anything());
        // WebSocket campus room only emits to clients who joined campus:DN
        expect(prisma.notification.createMany.mock.calls[0][0].data).toHaveLength(1);
        expect(prisma.notification.createMany.mock.calls[0][0].data[0].toUserId).toBe('dn-officer-1');
    });
});
