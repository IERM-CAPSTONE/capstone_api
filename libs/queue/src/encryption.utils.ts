import * as crypto from 'crypto';

/**
 * AES Encryption/Decryption utilities for image data
 * Must match with Flutter's encryption implementation
 */
export class EncryptionUtils {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly IV_LENGTH = 16;

  /**
   * Decrypt encrypted image data from Flutter
   * @param encryptedBase64 - Base64 encoded encrypted data
   * @param key - 32-character encryption key (must match Flutter)
   * @returns Decrypted buffer
   */
  static decryptImage(encryptedBase64: string, key: string): Buffer {
    if (key.length !== 32) {
      throw new Error('Encryption key must be exactly 32 characters');
    }

    try {
      // Decode base64
      const encryptedData = Buffer.from(encryptedBase64, 'base64');

      // Create IV (must match Flutter's IV)
      const iv = Buffer.alloc(this.IV_LENGTH, 0);

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        Buffer.from(key, 'utf8'),
        iv,
      );

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate SHA-256 hash for data integrity verification
   * @param data - Data to hash
   * @returns Hex string of hash
   */
  static generateHash(data: Buffer | string): string {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  }

  /**
   * Verify data integrity using hash
   * @param data - Data to verify
   * @param receivedHash - Hash received from client
   * @returns True if hash matches
   */
  static verifyHash(data: Buffer | string, receivedHash: string): boolean {
    const computedHash = this.generateHash(data);
    return computedHash === receivedHash;
  }
}
