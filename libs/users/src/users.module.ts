import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { USER_REPOSITORY } from './domain';
import { PrismaUserRepository } from './infrastructure';
import { TokenService } from './infrastructure/token.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
  ],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    TokenService,
  ],
  exports: [USER_REPOSITORY, TokenService],
})
export class UsersCoreModule { }
