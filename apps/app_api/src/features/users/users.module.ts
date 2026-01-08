import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Domain
import { USER_REPOSITORY } from './domain';

// Infrastructure
import { PrismaUserRepository } from './infrastructure';
import { TokenService } from './infrastructure/token.service';
import { GoogleStrategy } from './infrastructure/google.strategy';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { JwtRefreshStrategy } from './infrastructure/jwt-refresh.strategy';

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

@Module({
    imports: [
        PrismaModule,
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
    ],
    providers: [
        // Repository
        { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
        // Infrastructure - Auth
        TokenService,
        GoogleStrategy,
        JwtStrategy,
        JwtRefreshStrategy,
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
    ],
    exports: [USER_REPOSITORY, TokenService],
})
export class UsersModule { }
