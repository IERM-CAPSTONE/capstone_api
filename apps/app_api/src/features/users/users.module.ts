import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersCoreModule } from '@app/users';

// Infrastructure (Auth strategies stay in app_api as they are API-specific)
// Although some might argue they belong to infrastructure, strategies often depend on controllers/endpoints context
import { GoogleStrategy } from './infrastructure/google.strategy';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { JwtRefreshStrategy } from './infrastructure/jwt-refresh.strategy';
import { RolesGuard, JwtAuthGuard } from '../../common/guards';

// Use Cases - User Management
import { CreateUserHandler, CreateUserEndpoint } from './use-cases/create-user';
import { UpdateUserHandler, UpdateUserEndpoint } from './use-cases/update-user';
import { DeleteUserHandler, DeleteUserEndpoint } from './use-cases/delete-user';
import { ChangeRoleHandler, ChangeRoleEndpoint } from './use-cases/change-role';
import { GetUserHandler, GetUserEndpoint } from './use-cases/get-user';
import { ListUsersHandler, ListUsersEndpoint } from './use-cases/list-users';

// Use Cases - Authentication
import { GoogleLoginHandler, GoogleLoginEndpoint } from './use-cases/google-login';
import { RefreshTokenHandler, RefreshTokenEndpoint } from './use-cases/refresh-token';
import { LogoutHandler, LogoutEndpoint } from './use-cases/logout';

// Use Cases - Import
import { ImportStudentHandler, ImportStudentEndpoint, ImportFinishedProcessor } from './use-cases/import-student';
import { TestTokenHandler, TestTokenEndpoint } from './use-cases/test-token';
import { NotificationGateway } from '../../common/gateways/notification.gateway';
import { MeEndpoint } from './use-cases/me';

@Module({
    imports: [
        UsersCoreModule, // Contain Repository, TokenService, Prisma
        PassportModule,
        JwtModule.register({}),
    ],
    controllers: [
        // User Management
        CreateUserEndpoint,
        UpdateUserEndpoint,
        DeleteUserEndpoint,
        ChangeRoleEndpoint,
        GetUserEndpoint,
        ListUsersEndpoint,
        // Authentication
        GoogleLoginEndpoint,
        RefreshTokenEndpoint,
        LogoutEndpoint,
        ImportStudentEndpoint,
        ImportFinishedProcessor,
        TestTokenEndpoint,
        MeEndpoint,
    ],
    providers: [
        // Infrastructure - Auth
        GoogleStrategy,
        JwtStrategy,
        JwtRefreshStrategy,
        RolesGuard,
        JwtAuthGuard,
        // Handlers - User Management
        CreateUserHandler,
        UpdateUserHandler,
        DeleteUserHandler,
        ChangeRoleHandler,
        GetUserHandler,
        ListUsersHandler,
        // Handlers - Authentication
        GoogleLoginHandler,
        RefreshTokenHandler,
        LogoutHandler,
        ImportStudentHandler,
        TestTokenHandler,
        NotificationGateway,
    ],
})
export class UsersModule { }
