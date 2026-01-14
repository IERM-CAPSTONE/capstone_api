import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUserHandler } from './delete-user.handler';
import { USER_REPOSITORY, IUserRepository } from '@app/users';

describe('DeleteUserHandler', () => {
    let handler: DeleteUserHandler;
    let userRepository: jest.Mocked<IUserRepository>;

    const userId = 'user-uuid';

    beforeEach(async () => {
        const mockRepo = {
            findOne: jest.fn(),
            delete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeleteUserHandler,
                { provide: USER_REPOSITORY, useValue: mockRepo },
            ],
        }).compile();

        handler = module.get<DeleteUserHandler>(DeleteUserHandler);
        userRepository = module.get(USER_REPOSITORY);
    });

    describe('execute', () => {
        it('should delete user successfully', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue({ id: userId } as any);
            userRepository.delete.mockResolvedValue();

            // Act
            await handler.execute(userId);

            // Assert
            expect(userRepository.findOne).toHaveBeenCalledWith({ id: userId });
            expect(userRepository.delete).toHaveBeenCalledWith(userId);
        });

        it('should throw error if user not found', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(handler.execute(userId)).rejects.toThrow(`User '${userId}' not found`);
            expect(userRepository.delete).not.toHaveBeenCalled();
        });

        it('should propagate errors from repository delete', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue({ id: userId } as any);
            userRepository.delete.mockRejectedValue(new Error('Delete failed'));

            // Act & Assert
            await expect(handler.execute(userId)).rejects.toThrow('Delete failed');
        });
    });
});
