import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProcessTicketHandler } from './process-ticket.handler';
import { TicketWorkflowService } from '../../ticket-workflow.service';
import { PrismaService } from '@app/prisma';
import { ProcessAction } from './process-ticket.dto';

describe('ProcessTicketHandler', () => {
    let handler: ProcessTicketHandler;
    let workflow: jest.Mocked<Pick<TicketWorkflowService, 'getTicketOrThrow' | 'applyLifecycle' | 'addComment' | 'routeTicket'>>;
    let prisma: any;

    const TID = 'ticket-001';
    const OID = 'officer-001';
    const ticket = {
        id: TID,
        issueName: 'Cheating',
        issueType: 'Academic Violation',
        status: 'OPEN',
        reporterId: 'reporter-001',
        studentCode: 'SE140001',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProcessTicketHandler,
                {
                    provide: TicketWorkflowService,
                    useValue: {
                        getTicketOrThrow: jest.fn(),
                        applyLifecycle: jest.fn(),
                        addComment: jest.fn(),
                        routeTicket: jest.fn(),
                    },
                },
                {
                    provide: PrismaService,
                    useValue: {
                        user: { findUnique: jest.fn() },
                    },
                },
            ],
        }).compile();

        handler = module.get(ProcessTicketHandler);
        workflow = module.get(TicketWorkflowService);
        prisma = module.get(PrismaService);
    });

    describe('Resolve', () => {
        it('keeps ticket status unchanged and records AI training data', async () => {
            workflow.getTicketOrThrow.mockResolvedValue(ticket);
            workflow.addComment.mockResolvedValue({ ...ticket, status: 'OPEN' });

            const r = await handler.execute(TID, { action: ProcessAction.RESOLVE, resolveNote: 'Resolved.' }, OID);

            expect(workflow.addComment).toHaveBeenCalledWith(
                TID,
                OID,
                'RESOLUTION',
                expect.objectContaining({
                    body: 'Resolved.',
                    note: undefined,
                    techNote: null,
                }),
            );
            expect(r.status).toBe('OPEN');
        });

        it('passes through an in-progress ticket without auto-closing it', async () => {
            workflow.getTicketOrThrow.mockResolvedValue({ ...ticket, status: 'IN_PROGRESS' });
            workflow.addComment.mockResolvedValue({ ...ticket, status: 'IN_PROGRESS' });

            const r = await handler.execute(TID, { action: ProcessAction.RESOLVE, resolveNote: 'Resolved.' }, OID);

            expect(r.status).toBe('IN_PROGRESS');
        });

        it('throws NotFoundException when ticket is missing', async () => {
            workflow.getTicketOrThrow.mockRejectedValue(new NotFoundException('not found'));

            await expect(
                handler.execute('bad-id', { action: ProcessAction.RESOLVE, resolveNote: 'Resolved.' }, OID),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('Assign', () => {
        it('routes to the assignee role and returns the workflow result', async () => {
            workflow.getTicketOrThrow.mockResolvedValue(ticket);
            prisma.user.findUnique.mockResolvedValue({ role: 'IT_SUPPORT' });
            workflow.routeTicket.mockResolvedValue({ ...ticket, status: 'IN_PROGRESS', assigneeId: 'it-001' });

            const r = await handler.execute(TID, { action: ProcessAction.ASSIGN, assigneeId: 'it-001' }, OID);

            expect(workflow.routeTicket).toHaveBeenCalledWith(TID, OID, 'IT_SUPPORT', undefined);
            expect(r.assigneeId).toBe('it-001');
            expect(r.status).toBe('IN_PROGRESS');
        });

        it('rejects missing assigneeId for legacy assign', async () => {
            workflow.getTicketOrThrow.mockResolvedValue(ticket);

            await expect(
                handler.execute(TID, { action: ProcessAction.ASSIGN }, OID),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
