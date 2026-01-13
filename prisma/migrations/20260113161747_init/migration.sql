-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EXAM_OFFICER', 'PROCTOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "StudentExamStatus" AS ENUM ('REGISTERED', 'CHECKEDIN', 'CHECKEDOUT', 'MOVED', 'REMOVED');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('PENDING', 'CLOSED', 'IN_PROGRESS', 'SOLVED', 'OPEN');

-- CreateEnum
CREATE TYPE "PreferredShift" AS ENUM ('MORNING', 'AFTERNOON');

-- CreateEnum
CREATE TYPE "PreferredType" AS ENUM ('ROOM', 'HALL');

-- CreateEnum
CREATE TYPE "ProctorApplicationStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "location" TEXT,
    "registeredBy" TEXT NOT NULL,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRoom" (
    "id" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSession" (
    "id" TEXT NOT NULL,
    "examRoomId" TEXT,
    "proctorId" TEXT,
    "hallInvigilatorId" TEXT,
    "subjectCode" TEXT,
    "examOpenTime" TIMESTAMP(3),
    "examCloseTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaceEnrollment" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "deviceId" TEXT,
    "vector" JSONB NOT NULL,
    "quality" DOUBLE PRECISION,
    "model" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaceEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Identity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "faceImage" TEXT,
    "frontCCCD" TEXT,
    "backCCCD" TEXT,
    "extractedData" JSONB,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "activeVector" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueTicket" (
    "id" TEXT NOT NULL,
    "issueName" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "issueType" TEXT,
    "description" TEXT,
    "sessionId" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'PENDING',
    "attachment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "fromId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" TEXT,
    "meta" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProctorApplication" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "preferredShift" "PreferredShift" NOT NULL,
    "preferredType" "PreferredType" NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "notes" TEXT,
    "status" "ProctorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProctorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProctorAssignment" (
    "id" TEXT NOT NULL,
    "proctorId" TEXT NOT NULL,
    "examSessionId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProctorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentExam" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "seatNumber" INTEGER,
    "status" "StudentExamStatus" NOT NULL DEFAULT 'CHECKEDIN',
    "identityId" TEXT,
    "isMatched" BOOLEAN NOT NULL DEFAULT false,
    "checkinTime" TIMESTAMP(3),
    "checkoutTime" TIMESTAMP(3),
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "code" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "role" "Role",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT,
    "performer" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_serial_key" ON "Device"("serial");

-- CreateIndex
CREATE INDEX "Device_registeredBy_idx" ON "Device"("registeredBy");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoom_roomNumber_key" ON "ExamRoom"("roomNumber");

-- CreateIndex
CREATE INDEX "ExamSession_examRoomId_idx" ON "ExamSession"("examRoomId");

-- CreateIndex
CREATE INDEX "ExamSession_proctorId_idx" ON "ExamSession"("proctorId");

-- CreateIndex
CREATE INDEX "ExamSession_hallInvigilatorId_idx" ON "ExamSession"("hallInvigilatorId");

-- CreateIndex
CREATE INDEX "ExamSession_subjectCode_idx" ON "ExamSession"("subjectCode");

-- CreateIndex
CREATE INDEX "ExamSession_examOpenTime_examCloseTime_idx" ON "ExamSession"("examOpenTime", "examCloseTime");

-- CreateIndex
CREATE INDEX "FaceEnrollment_identityId_idx" ON "FaceEnrollment"("identityId");

-- CreateIndex
CREATE INDEX "FaceEnrollment_deviceId_idx" ON "FaceEnrollment"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Identity_userId_key" ON "Identity"("userId");

-- CreateIndex
CREATE INDEX "IssueTicket_reporterId_idx" ON "IssueTicket"("reporterId");

-- CreateIndex
CREATE INDEX "IssueTicket_assigneeId_idx" ON "IssueTicket"("assigneeId");

-- CreateIndex
CREATE INDEX "IssueTicket_sessionId_idx" ON "IssueTicket"("sessionId");

-- CreateIndex
CREATE INDEX "Notification_toId_idx" ON "Notification"("toId");

-- CreateIndex
CREATE INDEX "Notification_fromId_idx" ON "Notification"("fromId");

-- CreateIndex
CREATE INDEX "ProctorApplication_teacherId_idx" ON "ProctorApplication"("teacherId");

-- CreateIndex
CREATE INDEX "ProctorAssignment_assignedById_idx" ON "ProctorAssignment"("assignedById");

-- CreateIndex
CREATE INDEX "ProctorAssignment_examSessionId_idx" ON "ProctorAssignment"("examSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProctorAssignment_proctorId_examSessionId_key" ON "ProctorAssignment"("proctorId", "examSessionId");

-- CreateIndex
CREATE INDEX "StudentExam_studentId_idx" ON "StudentExam"("studentId");

-- CreateIndex
CREATE INDEX "StudentExam_examId_idx" ON "StudentExam"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentExam_examId_studentId_key" ON "StudentExam"("examId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_code_key" ON "User"("code");

-- CreateIndex
CREATE INDEX "UserActivity_userId_idx" ON "UserActivity"("userId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_registeredBy_fkey" FOREIGN KEY ("registeredBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_examRoomId_fkey" FOREIGN KEY ("examRoomId") REFERENCES "ExamRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_proctorId_fkey" FOREIGN KEY ("proctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_hallInvigilatorId_fkey" FOREIGN KEY ("hallInvigilatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaceEnrollment" ADD CONSTRAINT "FaceEnrollment_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaceEnrollment" ADD CONSTRAINT "FaceEnrollment_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Identity" ADD CONSTRAINT "Identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTicket" ADD CONSTRAINT "IssueTicket_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTicket" ADD CONSTRAINT "IssueTicket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTicket" ADD CONSTRAINT "IssueTicket_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_toId_fkey" FOREIGN KEY ("toId") REFERENCES "ExamRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctorApplication" ADD CONSTRAINT "ProctorApplication_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctorAssignment" ADD CONSTRAINT "ProctorAssignment_proctorId_fkey" FOREIGN KEY ("proctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctorAssignment" ADD CONSTRAINT "ProctorAssignment_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctorAssignment" ADD CONSTRAINT "ProctorAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExam" ADD CONSTRAINT "StudentExam_examId_fkey" FOREIGN KEY ("examId") REFERENCES "ExamSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExam" ADD CONSTRAINT "StudentExam_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExam" ADD CONSTRAINT "StudentExam_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
