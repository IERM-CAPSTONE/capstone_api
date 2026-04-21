import { Test, TestingModule } from '@nestjs/testing';
import { ImportFinishedProcessor } from './import-finished.processor';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';
import { RmqContext } from '@nestjs/microservices';

describe('ImportFinishedProcessor', () => {
    let processor: ImportFinishedProcessor;
    let notificationGateway: jest.Mocked<NotificationGateway>;

    const mockNotificationGateway = {
        sendToAll: jest.fn(),
    };

    const mockRmqContext = {
        getChannelRef: jest.fn().mockReturnValue({
            ack: jest.fn(),
        }),
        getMessage: jest.fn().mockReturnValue({}),
    } as unknown as RmqContext;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ImportFinishedProcessor],
            providers: [
                { provide: NotificationGateway, useValue: mockNotificationGateway },
            ],
        }).compile();

        processor = module.get<ImportFinishedProcessor>(ImportFinishedProcessor);
        notificationGateway = module.get(NotificationGateway);
    });

    it('should handle import finished message and send notification', async () => {
        const data = {
            fileName: 'students.xlsx',
            successCount: 10,
            errorCount: 2,
            timestamp: new Date(),
        };

        await processor.handleImportFinished(data, mockRmqContext);

        expect(notificationGateway.sendToAll).toHaveBeenCalledWith('IMPORT_COMPLETED', {
            message: `Import file ${data.fileName} completed!`,
            success: data.successCount,
            errors: data.errorCount,
            timestamp: data.timestamp,
        });
        expect(mockRmqContext.getChannelRef().ack).toHaveBeenCalled();
    });
});
