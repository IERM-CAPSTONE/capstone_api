import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserHandler } from './create-user.handler';
import { USER_REPOSITORY, IUserRepository, User, RoleType } from '@app/users';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserHandler', () => {
    let handler: CreateUserHandler;
    let userRepository: jest.Mocked<IUserRepository>;

    const createDto: CreateUserDto = {
        email: 'new@fpt.edu.vn',
        username: 'newuser',
        fullName: 'New User',
        code: 'SE123456',
        role: RoleType.STUDENT,
    };

    beforeEach(async () => {
        const mockRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateUserHandler,
                { provide: USER_REPOSITORY, useValue: mockRepo },
            ],
        }).compile();

        handler = module.get<CreateUserHandler>(CreateUserHandler);
        userRepository = module.get(USER_REPOSITORY);
    });

    describe('execute', () => {
        it('should create a user successfully', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(null);
            userRepository.save.mockImplementation(async (u) => u);

            // Act
            const result = await handler.execute(createDto);

            // Assert
            expect(userRepository.findOne).toHaveBeenCalledTimes(3); // email, code, username
            expect(userRepository.save).toHaveBeenCalled();
            expect(result.email).toBe(createDto.email);
            expect(result.username).toBe(createDto.username);
            expect(result.fullName).toBe(createDto.fullName);
            expect(result.code).toBe(createDto.code);
            expect(result.role).toBe(createDto.role);
        });

        it('should throw error if email format is invalid', async () => {
            const invalidDto = { ...createDto, email: 'invalid-email' };
            await expect(handler.execute(invalidDto)).rejects.toThrow(`Invalid email format: 'invalid-email'`);
        });

        it('should throw error if fullName is missing', async () => {
            const invalidDto = { ...createDto, fullName: '' };
            await expect(handler.execute(invalidDto)).rejects.toThrow('Full name is required');
        });

        it('should throw error if email already exists', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValueOnce({ id: 'existing-id' } as User);

            // Act & Assert
            await expect(handler.execute(createDto)).rejects.toThrow(`Email '${createDto.email}' already exists`);
            expect(userRepository.save).not.toHaveBeenCalled();
        });

        it('should throw error if code already exists', async () => {
            // Arrange
            userRepository.findOne
                .mockResolvedValueOnce(null) // email check
                .mockResolvedValueOnce({ id: 'existing-id' } as User); // code check

            // Act & Assert
            await expect(handler.execute(createDto)).rejects.toThrow(`Code '${createDto.code}' already exists`);
            expect(userRepository.save).not.toHaveBeenCalled();
        });

        it('should throw error if username already exists', async () => {
            // Arrange
            userRepository.findOne
                .mockResolvedValueOnce(null) // email check
                .mockResolvedValueOnce(null) // code check
                .mockResolvedValueOnce({ id: 'existing-id' } as User); // username check

            // Act & Assert
            await expect(handler.execute(createDto)).rejects.toThrow(`Username '${createDto.username}' already exists`);
            expect(userRepository.save).not.toHaveBeenCalled();
        });

        it('should propagate errors from repository save', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(null);
            userRepository.save.mockRejectedValue(new Error('DB Error'));

            // Act & Assert
            await expect(handler.execute(createDto)).rejects.toThrow('DB Error');
        });
    });
});
