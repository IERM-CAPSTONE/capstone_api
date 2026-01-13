import { Test, TestingModule } from '@nestjs/testing';
import { ChangeRoleHandler } from './change-role.handler';
import { USER_REPOSITORY, IUserRepository, User, RoleType } from '@app/users';
import { ChangeRoleDto } from './change-role.dto';

describe('ChangeRoleHandler', () => {
    let handler: ChangeRoleHandler;
    let userRepository: jest.Mocked<IUserRepository>;

    const userId = 'user-uuid';
    const changeRoleDto: ChangeRoleDto = {
        role: RoleType.ADMIN,
    };

    const mockUser = User.create({
        id: userId,
        email: 'test@fpt.edu.vn',
        fullName: 'Test User',
        role: RoleType.STUDENT,
    });

    beforeEach(async () => {
        const mockRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChangeRoleHandler,
                { provide: USER_REPOSITORY, useValue: mockRepo },
            ],
        }).compile();

        handler = module.get<ChangeRoleHandler>(ChangeRoleHandler);
        userRepository = module.get(USER_REPOSITORY);
    });

    describe('execute', () => {
        it('should change user role successfully', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.save.mockImplementation(async (u) => u);

            // Act
            const result = await handler.execute(userId, changeRoleDto);

            // Assert
            expect(userRepository.findOne).toHaveBeenCalledWith({ id: userId });
            expect(userRepository.save).toHaveBeenCalled();
            expect(result.role).toBe(RoleType.ADMIN);
        });

        it('should throw error if user not found', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(handler.execute(userId, changeRoleDto)).rejects.toThrow(`User '${userId}' not found`);
        });

        it('should propagate errors from repository save', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.save.mockRejectedValue(new Error('Save failed'));

            // Act & Assert
            await expect(handler.execute(userId, changeRoleDto)).rejects.toThrow('Save failed');
        });
    });
});
