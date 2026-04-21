import { Test, TestingModule } from '@nestjs/testing';
import { ImportStudentHandler } from './import-student.handler';
import { RABBITMQ_CLIENTS, MESSAGE_PATTERNS } from '@app/queue';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';

describe('ImportStudentHandler', () => {
    let handler: ImportStudentHandler;
    let clientProxy: jest.Mocked<ClientProxy>;

    const mockFile = {
        originalname: 'students.xlsx',
        buffer: Buffer.from('fake-excel-content'),
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    } as Express.Multer.File;

    beforeEach(async () => {
        const mockClient = {
            emit: jest.fn().mockReturnValue(of({})),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ImportStudentHandler,
                { provide: RABBITMQ_CLIENTS.USER_SERVICE, useValue: mockClient },
            ],
        }).compile();

        handler = module.get<ImportStudentHandler>(ImportStudentHandler);
        clientProxy = module.get(RABBITMQ_CLIENTS.USER_SERVICE);
    });

    describe('handle', () => {
        it('should emit a message to RabbitMQ successfully', async () => {
            // Act
            const result = await handler.handle(mockFile);

            // Assert
            expect(clientProxy.emit).toHaveBeenCalledWith(
                MESSAGE_PATTERNS.USER.IMPORT_STUDENTS,
                expect.objectContaining({
                    fileName: mockFile.originalname,
                    fileContent: mockFile.buffer.toString('base64'),
                    mimeType: mockFile.mimetype,
                })
            );
            expect(result.message).toBe('file is processing');
        });

        it('should propagate errors from clientProxy.emit', async () => {
            // Arrange
            clientProxy.emit.mockImplementation(() => {
                throw new Error('Queue error');
            });

            // Act & Assert
            await expect(handler.handle(mockFile)).rejects.toThrow('Queue error');
        });
    });
});
