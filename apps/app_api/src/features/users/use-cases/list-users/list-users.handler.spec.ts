import { Test, TestingModule } from '@nestjs/testing';
import { ListUsersHandler } from './list-users.handler';
import { USER_REPOSITORY, IUserRepository, User, RoleType } from '@app/users';
import { ListUsersDto } from './list-users.dto';

describe('ListUsersHandler', () => {
    let handler: ListUsersHandler;
    let userRepository: jest.Mocked<IUserRepository>;

    beforeEach(async () => {
        const mockRepo = {
            findPaginated: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ListUsersHandler,
                { provide: USER_REPOSITORY, useValue: mockRepo },
            ],
        }).compile();

        handler = module.get<ListUsersHandler>(ListUsersHandler);
        userRepository = module.get(USER_REPOSITORY);
    });

    describe('execute', () => {
        it('should return paginated users successfully', async () => {
            // Arrange
            const dto: ListUsersDto = { page: 1, limit: 10 };
            const mockUser = User.create({
                id: 'id',
                email: 'test@fpt.edu.vn',
                fullName: 'Test User',
                role: RoleType.STUDENT,
            });
            const mockResult = {
                data: [mockUser],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            };
            userRepository.findPaginated.mockResolvedValue(mockResult);

            // Act
            const result = await handler.execute(dto);

            // Assert
            expect(userRepository.findPaginated).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
                role: undefined,
                isActive: undefined,
                search: undefined,
            });
            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.data[0].email).toBe(mockUser.email.value);
        });

        it('should apply filters and search in repository call', async () => {
            // Arrange
            const dto: ListUsersDto = { page: 2, limit: 5, role: RoleType.ADMIN, search: 'admin' };
            userRepository.findPaginated.mockResolvedValue({
                data: [],
                total: 0,
                page: 2,
                limit: 5,
                totalPages: 0,
            });

            // Act
            await handler.execute(dto);

            // Assert
            expect(userRepository.findPaginated).toHaveBeenCalledWith({
                page: 2,
                limit: 5,
                role: RoleType.ADMIN,
                isActive: undefined,
                search: 'admin',
            });
        });

        it('should use default pagination values if not provided', async () => {
            // Arrange
            const dto: ListUsersDto = {};
            userRepository.findPaginated.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            });

            // Act
            await handler.execute(dto);

            // Assert
            expect(userRepository.findPaginated).toHaveBeenCalledWith(expect.objectContaining({
                page: 1,
                limit: 10,
            }));
        });
    });
});
