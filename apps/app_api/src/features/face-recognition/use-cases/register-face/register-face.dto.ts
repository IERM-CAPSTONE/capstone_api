export class RegisterFaceDto {
  studentId: string;
  encryptedImages: Record<string, string>; // HeadPose -> Base64 encrypted image
  isEncrypted: boolean;
  imageHashes?: Record<string, string>; // Optional hash verification
}
