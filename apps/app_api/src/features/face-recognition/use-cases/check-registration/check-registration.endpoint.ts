import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CheckRegistrationHandler } from './check-registration.handler';

@Controller('face-recognition/check-registration')
export class CheckRegistrationEndpoint {
    constructor(private readonly handler: CheckRegistrationHandler) { }

    @Get(':studentId')
    async checkRegistration(@Param('studentId') studentId: string) {
        return this.handler.execute(studentId);
    }
}
