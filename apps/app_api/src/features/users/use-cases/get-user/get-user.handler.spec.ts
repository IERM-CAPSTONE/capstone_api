import { Test, TestingModule } from '@nestjs/testing';
import { GetUserHandler } from './get-user.handler';
import { USER_REPOSITORY, IUserRepository, User, RoleType } from '@app/users';

describe('GetUserHandler', () => {
    let handler: GetUserHandler;
    let userRepository: jest.Mocked<IUserRepository>;

    const mockUser = User.create({
        id: 'user-uuid',
        email: 'test@fpt.edu.vn',
        fullName: 'Test User',
        role: RoleType.STUDENT,
    });

    beforeEach(async () => {
        const mockRepo = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetUserHandler,
                { provide: USER_REPOSITORY, useValue: mockRepo },
            ],
        }).compile();

        handler = module.get<GetUserHandler>(GetUserHandler);
        userRepository = module.get(USER_REPOSITORY);
    });

    describe('execute', () => {
        it('should return user when found by ID', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(mockUser);

            // Act
            const result = await handler.execute({ id: 'user-uuid' });

            // Assert
            expect(userRepository.findOne).toHaveBeenCalledWith({ id: 'user-uuid' });
            expect(result).toBeDefined();
            expect(result?.email).toBe(mockUser.email.value);
        });

        it('should return user when found by email', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(mockUser);

            // Act
            const result = await handler.execute({ email: 'test@fpt.edu.vn' });

            // Assert
            expect(userRepository.findOne).toHaveBeenCalledWith({ email: 'test@fpt.edu.vn' });
            expect(result).toBeDefined();
        });

        it('should return null when user not found', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(null);

            // Act
            const result = await handler.execute({ id: 'non-existent' });

            // Assert
            expect(result).toBeNull();
        });

        it('should propagate errors from repository', async () => {
            // Arrange
            userRepository.findOne.mockRejectedValue(new Error('DB Error'));

            // Act & Assert
            await expect(handler.execute({ id: 'error' })).rejects.toThrow('DB Error');
        });
    });
});
