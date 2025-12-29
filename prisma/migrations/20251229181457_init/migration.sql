-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

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
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "roleName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT,
    "username" TEXT,
    "code" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "roleId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Identity" (
    "id" SERIAL NOT NULL,
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
CREATE TABLE "ExamRoom" (
    "id" SERIAL NOT NULL,
    "roomNumber" INTEGER NOT NULL,
    "floorArea" INTEGER,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSession" (
    "id" SERIAL NOT NULL,
    "examRoomId" INTEGER,
    "proctorId" TEXT,
    "hallInvigilatorId" TEXT,
    "semesterCode" TEXT,
    "examOpenTime" TIMESTAMP(3),
    "examCloseTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentExam" (
    "id" SERIAL NOT NULL,
    "examId" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "seatNumber" INTEGER,
    "status" "StudentExamStatus" NOT NULL DEFAULT 'CHECKEDIN',
    "identityId" INTEGER,
    "isMatched" BOOLEAN NOT NULL DEFAULT false,
    "checkinTime" TIMESTAMP(3),
    "checkoutTime" TIMESTAMP(3),
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueTicket" (
    "id" SERIAL NOT NULL,
    "issueName" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "issueType" TEXT,
    "description" TEXT,
    "sessionId" INTEGER,
    "status" "IssueStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProctorApplication" (
    "id" SERIAL NOT NULL,
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
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
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
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
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
CREATE TABLE "FaceEnrollment" (
    "id" SERIAL NOT NULL,
    "identityId" INTEGER NOT NULL,
    "deviceId" INTEGER,
    "vector" JSONB NOT NULL,
    "quality" DOUBLE PRECISION,
    "model" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaceEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "examSessionId" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "usedById" TEXT,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "ExamCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "ticketId" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProctorAssignment" (
    "id" SERIAL NOT NULL,
    "proctorId" TEXT NOT NULL,
    "examSessionId" INTEGER NOT NULL,
    "assignedById" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProctorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleName_key" ON "Role"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Identity_userId_key" ON "Identity"("userId");

-- CreateIndex
CREATE INDEX "ExamSession_examRoomId_idx" ON "ExamSession"("examRoomId");

-- CreateIndex
CREATE INDEX "ExamSession_proctorId_idx" ON "ExamSession"("proctorId");

-- CreateIndex
CREATE INDEX "ExamSession_hallInvigilatorId_idx" ON "ExamSession"("hallInvigilatorId");

-- CreateIndex
CREATE INDEX "StudentExam_studentId_idx" ON "StudentExam"("studentId");

-- CreateIndex
CREATE INDEX "StudentExam_examId_idx" ON "StudentExam"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentExam_examId_studentId_key" ON "StudentExam"("examId", "studentId");

-- CreateIndex
CREATE INDEX "IssueTicket_reporterId_idx" ON "IssueTicket"("reporterId");

-- CreateIndex
CREATE INDEX "IssueTicket_assigneeId_idx" ON "IssueTicket"("assigneeId");

-- CreateIndex
CREATE INDEX "IssueTicket_sessionId_idx" ON "IssueTicket"("sessionId");

-- CreateIndex
CREATE INDEX "ProctorApplication_teacherId_idx" ON "ProctorApplication"("teacherId");

-- CreateIndex
CREATE INDEX "Notification_toId_idx" ON "Notification"("toId");

-- CreateIndex
CREATE INDEX "Notification_fromId_idx" ON "Notification"("fromId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_serial_key" ON "Device"("serial");

-- CreateIndex
CREATE INDEX "Device_registeredBy_idx" ON "Device"("registeredBy");

-- CreateIndex
CREATE INDEX "FaceEnrollment_identityId_idx" ON "FaceEnrollment"("identityId");

-- CreateIndex
CREATE INDEX "FaceEnrollment_deviceId_idx" ON "FaceEnrollment"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamCode_code_key" ON "ExamCode"("code");

-- CreateIndex
CREATE INDEX "ExamCode_examSessionId_idx" ON "ExamCode"("examSessionId");

-- CreateIndex
CREATE INDEX "ExamCode_createdById_idx" ON "ExamCode"("createdById");

-- CreateIndex
CREATE INDEX "ExamCode_usedById_idx" ON "ExamCode"("usedById");

-- CreateIndex
CREATE INDEX "Attachment_ticketId_idx" ON "Attachment"("ticketId");

-- CreateIndex
CREATE INDEX "Attachment_uploadedById_idx" ON "Attachment"("uploadedById");

-- CreateIndex
CREATE INDEX "ProctorAssignment_assignedById_idx" ON "ProctorAssignment"("assignedById");

-- CreateIndex
CREATE INDEX "ProctorAssignment_examSessionId_idx" ON "ProctorAssignment"("examSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProctorAssignment_proctorId_examSessionId_key" ON "ProctorAssignment"("proctorId", "examSessionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Identity" ADD CONSTRAINT "Identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_examRoomId_fkey" FOREIGN KEY ("examRoomId") REFERENCES "ExamRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_proctorId_fkey" FOREIGN KEY ("proctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_hallInvigilatorId_fkey" FOREIGN KEY ("hallInvigilatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExam" ADD CONSTRAINT "StudentExam_examId_fkey" FOREIGN KEY ("examId") REFERENCES "ExamSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExam" ADD CONSTRAINT "StudentExam_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExam" ADD CONSTRAINT "StudentExam_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTicket" ADD CONSTRAINT "IssueTicket_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTicket" ADD CONSTRAINT "IssueTicket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTicket" ADD CONSTRAINT "IssueTicket_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctorApplication" ADD CONSTRAINT "ProctorApplication_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_toId_fkey" FOREIGN KEY ("toId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_registeredBy_fkey" FOREIGN KEY ("registeredBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaceEnrollment" ADD CONSTRAINT "FaceEnrollment_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "Identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaceEnrollment" ADD CONSTRAINT "FaceEnrollment_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamCode" ADD CONSTRAINT "ExamCode_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamCode" ADD CONSTRAINT "ExamCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamCode" ADD CONSTRAINT "ExamCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "IssueTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctorAssignment" ADD CONSTRAINT "ProctorAssignment_proctorId_fkey" FOREIGN KEY ("proctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctorAssignment" ADD CONSTRAINT "ProctorAssignment_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProctorAssignment" ADD CONSTRAINT "ProctorAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
