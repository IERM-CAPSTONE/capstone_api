import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { USER_REPOSITORY, IDENTITY_REPOSITORY } from './domain';
import { PrismaUserRepository, PrismaIdentityRepository } from './infrastructure';
import { TokenService } from './infrastructure/token.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
  ],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: IDENTITY_REPOSITORY, useClass: PrismaIdentityRepository },
    TokenService,
  ],
  exports: [USER_REPOSITORY, IDENTITY_REPOSITORY, TokenService],
})
export class UsersCoreModule { }
