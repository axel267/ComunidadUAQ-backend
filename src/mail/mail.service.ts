import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendWelcomePassword(to: string, nombre: string, password: string): Promise<{ sent: boolean; error?: string }> {
    const mailOptions = {
      from: `"Comunidad UAQ" <${this.configService.get<string>('MAIL_USER')}>`,
      to,
      subject: '🎓 Bienvenido a Comunidad UAQ – Tu contraseña temporal',
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Bienvenido a Comunidad UAQ</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#003d7a,#0066cc);padding:40px 40px 30px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:1px;">🎓 Comunidad UAQ</h1>
                      <p style="margin:8px 0 0;color:#a8d4ff;font-size:14px;">Universidad Autónoma de Querétaro</p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;">¡Hola, ${nombre}! 👋</h2>
                      <p style="margin:0 0 20px;color:#4a4a6a;font-size:15px;line-height:1.6;">
                        Tu cuenta en <strong>Comunidad UAQ</strong> ha sido creada exitosamente.
                        A continuación encontrarás tu <strong>contraseña temporal</strong> para iniciar sesión.
                      </p>
                      <!-- Password box -->
                      <div style="background:#f0f7ff;border:2px dashed #0066cc;border-radius:10px;padding:24px;text-align:center;margin:28px 0;">
                        <p style="margin:0 0 8px;color:#6b7c93;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Tu contraseña temporal</p>
                        <span style="font-size:28px;font-weight:700;color:#003d7a;letter-spacing:4px;font-family:'Courier New',monospace;">${password}</span>
                      </div>
                      <!-- Warning -->
                      <div style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:6px;padding:16px 20px;margin-bottom:28px;">
                        <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
                          ⚠️ <strong>Importante:</strong> Por seguridad, te recomendamos cambiar esta contraseña la primera vez que inicies sesión. Ve a <em>Perfil → Cambiar contraseña</em>.
                        </p>
                      </div>
                      <p style="margin:0;color:#4a4a6a;font-size:14px;line-height:1.6;">
                        Si no solicitaste esta cuenta, ignora este correo o contáctanos a <a href="mailto:soporte@uaq.mx" style="color:#0066cc;">soporte@uaq.mx</a>.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background:#f4f6f9;padding:20px 40px;text-align:center;border-top:1px solid #e8ecf0;">
                      <p style="margin:0;color:#9aa5b4;font-size:12px;">© 2026 Universidad Autónoma de Querétaro · Todos los derechos reservados</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { sent: true };
    } catch (error) {
      // Loguear el error pero NO lanzar excepción — la cuenta ya fue creada
      console.error('[MailService] Error al enviar correo:', error);
      return { sent: false, error: String(error) };
    }
  }
}
