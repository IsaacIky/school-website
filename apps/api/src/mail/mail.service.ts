import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Sends transactional email over SMTP.
 *
 * When SMTP_HOST is not set, outside production the message is written to the
 * log instead (so OTP flows work locally); in production sending fails loudly.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  private readonly isProduction: boolean;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    this.isProduction = config.get<string>('NODE_ENV') === 'production';
    this.from = config.get<string>('MAIL_FROM', 'no-reply@university.ac.zw');
    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: Number(config.get<string>('SMTP_PORT', '587')),
          secure: config.get<string>('SMTP_SECURE') === 'true',
          auth: config.get<string>('SMTP_USER')
            ? { user: config.get<string>('SMTP_USER'), pass: config.get<string>('SMTP_PASS') }
            : undefined,
        })
      : null;
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter) {
      if (this.isProduction) {
        this.logger.error('SMTP_HOST is not configured; cannot send email');
        throw new ServiceUnavailableException('Email delivery is not configured');
      }
      this.logger.warn(`[dev mail] to=${to} subject="${subject}"\n${text}`);
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, text });
  }
}
