import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv } from 'crypto';
import { getSystemConfigs } from 'src/init/check.config';
const systemConfig = getSystemConfigs();

@Injectable()
export class LoginService {
  generateToken(password: string) {
    const timestamp = Date.now();
    const data = JSON.stringify({ password, timestamp });
    const key = Buffer.from(systemConfig.ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(systemConfig.ENCRYPTION_IV, 'hex');

    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  decryptToken(encryptedText: string) {
    const key = Buffer.from(systemConfig.ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(systemConfig.ENCRYPTION_IV, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }
}
