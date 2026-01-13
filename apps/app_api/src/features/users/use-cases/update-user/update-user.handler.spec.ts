import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserHandler } from './update-user.handler';
import { USER_REPOSITORY, IUserRepository, User, RoleType } from '@app/users';
import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserHandler', () => {
    let handler: UpdateUserHandler;
    let userRepository: jest.Mocked<IUserRepository>;

    const userId = 'user-uuid';
    const updateDto: UpdateUserDto = {
        fullName: 'Updated Name',
        code: 'SE999999',
    };

    const mockUser = User.create({
        id: userId,
        email: 'test@fpt.edu.vn',
        fullName: 'Original Name',
        code: 'SE123456',
        role: RoleType.STUDENT,
    });

    beforeEach(async () => {
        const mockRepo = {
            findOne: jest.fn(),
            exists: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateUserHandler,
                { provide: USER_REPOSITORY, useValue: mockRepo },
            ],
        }).compile();

        handler = module.get<UpdateUserHandler>(UpdateUserHandler);
        userRepository = module.get(USER_REPOSITORY);
    });

    describe('execute', () => {
        it('should update user successfully', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.exists.mockResolvedValue(false);
            userRepository.save.mockImplementation(async (u) => u);

            // Act
            const result = await handler.execute(userId, updateDto);

            // Assert
            expect(userRepository.findOne).toHaveBeenCalledWith({ id: userId });
            expect(userRepository.exists).toHaveBeenCalledWith({ code: updateDto.code }, userId);
            expect(result.fullName).toBe(updateDto.fullName);
            expect(result.code).toBe(updateDto.code);
        });

        it('should throw error if user not found', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(handler.execute(userId, updateDto)).rejects.toThrow(`User '${userId}' not found`);
        });

        it('should throw error if code already taken by someone else', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.exists.mockResolvedValue(true);

            // Act & Assert
            await expect(handler.execute(userId, updateDto)).rejects.toThrow(`Code '${updateDto.code}' already exists`);
        });

        it('should not check code existence if code is not provided', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(mockUser);
            userRepository.save.mockImplementation(async (u) => u);

            // Act
            await handler.execute(userId, { fullName: 'Just Name' });

            // Assert
            expect(userRepository.exists).not.toHaveBeenCalled();
        });
    });
});
