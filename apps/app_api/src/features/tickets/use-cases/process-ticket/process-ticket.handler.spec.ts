import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProcessTicketHandler } from './process-ticket.handler';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';
import { PrismaService } from '@app/prisma';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';
import { ProcessAction } from './process-ticket.dto';

describe('ProcessTicketHandler', () => {
    let handler: ProcessTicketHandler;
    let ticketRepo: jest.Mocked<ITicketRepository>;
    let prisma: any;
    let gateway: any;

    const TID = 'ticket-001'; const OID = 'officer-001'; const RID = 'reporter-001';
    const ticket = { id: TID, issueName: 'Cheating', issueType: 'Academic Violation', status: 'OPEN', reporterId: RID, studentCode: 'SE140001' };
    const officer = { fullName: 'Nguyen Van A' };
    const resolveDto = { action: ProcessAction.RESOLVE, resolveNote: 'Resolved.' };
    const assignDto = { action: ProcessAction.ASSIGN, resolveNote: 'Forwarded', assigneeId: 'it-001' };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProcessTicketHandler,
                { provide: TICKET_REPOSITORY, useValue: { save: jest.fn(), findById: jest.fn(), findMany: jest.fn() } },
                { provide: PrismaService, useValue: { user: { findUnique: jest.fn() }, notification: { create: jest.fn() } } },
                { provide: NotificationGateway, useValue: { sendToAll: jest.fn(), sendToUser: jest.fn() } },
            ],
        }).compile();
        handler = module.get(ProcessTicketHandler);
        ticketRepo = module.get(TICKET_REPOSITORY);
        prisma = module.get(PrismaService);
        gateway = module.get(NotificationGateway);
    });

    // ── RESOLVE ───────────────────────────────────────────────────────────────
    describe('Resolve', () => {
        it('UTC01: resolve OPEN → SOLVED, notify reporter', async () => {
            ticketRepo.findById.mockResolvedValue(ticket);
            ticketRepo.save.mockImplementation(async (d) => ({ ...ticket, ...d }));
            prisma.user.findUnique.mockResolvedValue(officer);
            prisma.notification.create.mockResolvedValue({});
            const r = await handler.execute(TID, resolveDto, OID);
            expect(r.status).toBe('SOLVED');
            expect(prisma.notification.create).toHaveBeenCalledWith({ data: expect.objectContaining({ toUserId: RID }) });
            expect(gateway.sendToAll).toHaveBeenCalledWith('ticket:resolved', expect.objectContaining({ ticketId: TID }));
        });

        it('UTC02: resolve IN_PROGRESS → SOLVED', async () => {
            ticketRepo.findById.mockResolvedValue({ ...ticket, status: 'IN_PROGRESS' });
            ticketRepo.save.mockImplementation(async (d) => ({ ...ticket, ...d }));
            prisma.user.findUnique.mockResolvedValue(officer);
            prisma.notification.create.mockResolvedValue({});
            const r = await handler.execute(TID, resolveDto, OID);
            expect(r.status).toBe('SOLVED');
        });

        it('UTC05: officer not found → fallback name', async () => {
            ticketRepo.findById.mockResolvedValue(ticket);
            ticketRepo.save.mockImplementation(async (d) => ({ ...ticket, ...d }));
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.notification.create.mockResolvedValue({});
            await handler.execute(TID, resolveDto, OID);
            expect(gateway.sendToAll).toHaveBeenCalledWith('ticket:resolved', expect.objectContaining({ officerName: 'Exam Officer' }));
        });

        it('UTC06: ticket not found → NotFoundException', async () => {
            ticketRepo.findById.mockResolvedValue(null);
            await expect(handler.execute('bad-id', resolveDto, OID)).rejects.toThrow(NotFoundException);
            expect(ticketRepo.save).not.toHaveBeenCalled();
        });

        it('UTC07: repo save error → propagated', async () => {
            ticketRepo.findById.mockResolvedValue(ticket);
            ticketRepo.save.mockRejectedValue(new Error('DB fail'));
            await expect(handler.execute(TID, resolveDto, OID)).rejects.toThrow('DB fail');
        });

        it('UTC09: empty resolveNote → passed through', async () => {
            ticketRepo.findById.mockResolvedValue(ticket);
            ticketRepo.save.mockImplementation(async (d) => ({ ...ticket, ...d }));
            prisma.user.findUnique.mockResolvedValue(officer);
            prisma.notification.create.mockResolvedValue({});
            await handler.execute(TID, { ...resolveDto, resolveNote: '' }, OID);
            expect(ticketRepo.save).toHaveBeenCalledWith(expect.objectContaining({ resolveNote: '' }));
        });
    });

    // ── ASSIGN ────────────────────────────────────────────────────────────────
    describe('Assign', () => {
        it('UTC-A01: assign → IN_PROGRESS, notify assignee', async () => {
            ticketRepo.findById.mockResolvedValue(ticket);
            ticketRepo.save.mockImplementation(async (d) => ({ ...ticket, ...d }));
            prisma.user.findUnique.mockResolvedValue(officer);
            prisma.notification.create.mockResolvedValue({});
            const r = await handler.execute(TID, assignDto, OID);
            expect(r.status).toBe('IN_PROGRESS');
            expect(r.assigneeId).toBe('it-001');
            expect(prisma.notification.create).toHaveBeenCalledWith({ data: expect.objectContaining({ toUserId: 'it-001' }) });
            expect(gateway.sendToAll).toHaveBeenCalledWith('ticket:assigned', expect.objectContaining({ assigneeId: 'it-001' }));
        });

        it('UTC-A06: missing assigneeId → BadRequestException', async () => {
            ticketRepo.findById.mockResolvedValue(ticket);
            const badDto = { action: ProcessAction.ASSIGN, resolveNote: 'test' };
            await expect(handler.execute(TID, badDto, OID)).rejects.toThrow('assigneeId is required');
        });
    });
});
