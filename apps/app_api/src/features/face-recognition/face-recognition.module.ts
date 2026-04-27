import { Module } from '@nestjs/common';
import { UsersCoreModule } from '@app/users';
import { ExamSessionsCoreModule } from '@app/exam-sessions';

// Use Cases
import {
  RegisterFaceHandler,
  RegisterFaceEndpoint,
} from './use-cases/register-face';
import {
  AuthenticateFaceHandler,
  AuthenticateFaceEndpoint,
} from './use-cases/authenticate-face';
import {
  CheckRegistrationHandler,
  CheckRegistrationEndpoint,
} from './use-cases/check-registration';
import {
  ProctorCheckInEndpoint,
  ProctorCheckInHandler,
} from './use-cases/proctor-check-in';
import {
  ListAttendanceSnapshotsEndpoint,
  ListAttendanceSnapshotsHandler,
} from './use-cases/list-attendance-snapshots';
import { NotificationGateway } from '../../common/gateways';
import { CloudinaryModule } from '../../common/cloudinary/cloudinary.module';

// Supervised Enrollment
import { IssueEnrollmentOtpEndpoint } from './use-cases/issue-enrollment-otp/issue-enrollment-otp.endpoint';
import { IssueEnrollmentOtpHandler } from './use-cases/issue-enrollment-otp/issue-enrollment-otp.handler';
import { VerifyEnrollmentOtpEndpoint } from './use-cases/verify-enrollment-otp/verify-enrollment-otp.endpoint';
import { VerifyEnrollmentOtpHandler } from './use-cases/verify-enrollment-otp/verify-enrollment-otp.handler';
import { ApproveEnrollmentEndpoint } from './use-cases/approve-enrollment/approve-enrollment.endpoint';
import { ApproveEnrollmentHandler } from './use-cases/approve-enrollment/approve-enrollment.handler';
import { RejectEnrollmentEndpoint } from './use-cases/reject-enrollment/reject-enrollment.endpoint';
import { RejectEnrollmentHandler } from './use-cases/reject-enrollment/reject-enrollment.handler';
import { ListPendingEnrollmentsEndpoint } from './use-cases/list-pending-enrollments/list-pending-enrollments.endpoint';
import { ListPendingEnrollmentsHandler } from './use-cases/list-pending-enrollments/list-pending-enrollments.handler';

@Module({
  imports: [UsersCoreModule, ExamSessionsCoreModule, CloudinaryModule],
  controllers: [
    RegisterFaceEndpoint,
    AuthenticateFaceEndpoint,
    CheckRegistrationEndpoint,
    ProctorCheckInEndpoint,
    ListAttendanceSnapshotsEndpoint,
    IssueEnrollmentOtpEndpoint,
    VerifyEnrollmentOtpEndpoint,
    ApproveEnrollmentEndpoint,
    RejectEnrollmentEndpoint,
    ListPendingEnrollmentsEndpoint,
  ],
  providers: [
    RegisterFaceHandler,
    AuthenticateFaceHandler,
    CheckRegistrationHandler,
    ProctorCheckInHandler,
    ListAttendanceSnapshotsHandler,
    NotificationGateway,
    IssueEnrollmentOtpHandler,
    VerifyEnrollmentOtpHandler,
    ApproveEnrollmentHandler,
    RejectEnrollmentHandler,
    ListPendingEnrollmentsHandler,
  ],
})
export class FaceRecognitionModule {}
