import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private mailUser: string;
  private smtpConfigurado: boolean;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');
    this.mailUser = this.configService.get<string>('MAIL_USER', user || 'notificaciones@uaq.mx');

    // Verificar si las credenciales son reales o son placeholders de desarrollo
    this.smtpConfigurado = !!(user && pass && user !== 'tu_correo@gmail.com');

    if (this.smtpConfigurado) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
      this.logger.log(`Servicio SMTP configurado para: ${this.mailUser}`);
    } else {
      this.logger.warn(
        'Credenciales SMTP en .env contienen valores por defecto. Los correos se simularan en consola para desarrollo.',
      );
    }
  }

  /**
   * Envia correo de bienvenida con la contraseña temporal generada.
   */
  async sendWelcomePassword(
    to: string,
    nombre: string,
    password: string,
  ): Promise<{ sent: boolean; error?: string }> {
    if (!this.smtpConfigurado || !this.transporter) {
      this.logger.error('No se puede enviar la contraseña temporal: SMTP no está configurado.');
      return { sent: false, error: 'SMTP no está configurado.' };
    }

    const subject = 'Bienvenido a Comunidad UAQ - Tu contrasena temporal';
    const html = `
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
                <tr>
                  <td style="background:linear-gradient(135deg,#003d7a,#0066cc);padding:35px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">Comunidad UAQ</h1>
                    <p style="margin:6px 0 0;color:#a8d4ff;font-size:13px;">Universidad Autonoma de Queretaro</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Hola, ${nombre}</h2>
                    <p style="margin:0 0 20px;color:#4a4a6a;font-size:15px;line-height:1.6;">
                      Tu cuenta en <strong>Comunidad UAQ</strong> ha sido creada exitosamente.
                      A continuacion encontraras tu <strong>contrasena temporal</strong> para iniciar sesion.
                    </p>
                    <div style="background:#f0f7ff;border:2px dashed #0066cc;border-radius:10px;padding:20px;text-align:center;margin:24px 0;">
                      <p style="margin:0 0 6px;color:#6b7c93;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Tu contrasena temporal</p>
                      <span style="font-size:26px;font-weight:700;color:#003d7a;letter-spacing:4px;font-family:'Courier New',monospace;">${password}</span>
                    </div>
                    <div style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:6px;padding:14px 18px;margin-bottom:24px;">
                      <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
                        <strong>Importante:</strong> Por seguridad institucional, debes cambiar esta contrasena al iniciar sesion por primera vez.
                      </p>
                    </div>
                    <p style="margin:0;color:#4a4a6a;font-size:13px;line-height:1.6;">
                      Si no solicitaste esta cuenta, por favor comunicate a soporte@uaq.mx.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f4f6f9;padding:16px 40px;text-align:center;border-top:1px solid #e8ecf0;">
                    <p style="margin:0;color:#9aa5b4;font-size:12px;">(c) 2026 Universidad Autonoma de Queretaro - Todos los derechos reservados</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.enviarCorreo([to], subject, html);
  }

  /**
   * Envia una notificacion por correo a multiples destinatarios institucionales
   * cuando se publica un aviso (especialmente de prioridad Alta o Urgente).
   */
  async sendAvisoNotification(
    destinatarios: string[],
    aviso: {
      id: number;
      titulo: string;
      contenido?: string;
      urgencia: string;
      facultadNombre?: string;
      autorNombre?: string;
    },
  ): Promise<{ sent: boolean; totalDestinatarios: number; error?: string }> {
    if (!destinatarios || destinatarios.length === 0) {
      return { sent: true, totalDestinatarios: 0 };
    }

    const esUrgente = aviso.urgencia === 'URGENTE' || aviso.urgencia === 'ALTA';
    const subject = esUrgente
      ? `[AVISO URGENTE UAQ] ${aviso.titulo}`
      : `[Aviso UAQ] ${aviso.titulo}`;

    const colorCabecera = aviso.urgencia === 'URGENTE' ? '#991b1b' : '#003d7a';
    const colorSecundario = aviso.urgencia === 'URGENTE' ? '#dc2626' : '#0066cc';
    const etiquetaUrgencia = aviso.urgencia === 'URGENTE' ? 'COMUNICADO URGENTE' : `PRIORIDAD: ${aviso.urgencia}`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>${subject}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:35px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg,${colorCabecera},${colorSecundario});padding:30px 40px;text-align:center;">
                    <span style="display:inline-block;background:rgba(255,255,255,0.2);color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:4px 12px;border-radius:20px;text-transform:uppercase;margin-bottom:8px;">
                      ${etiquetaUrgencia}
                    </span>
                    <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Comunidad UAQ</h1>
                    <p style="margin:4px 0 0;color:#e2e8f0;font-size:13px;">${aviso.facultadNombre || 'Universidad Autonoma de Queretaro'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:35px 40px;">
                    <h2 style="margin:0 0 16px;color:#1e293b;font-size:19px;line-height:1.4;">${aviso.titulo}</h2>
                    <div style="color:#475569;font-size:15px;line-height:1.7;margin-bottom:24px;">
                      ${aviso.contenido || 'Consulta los detalles de este aviso ingresando a la plataforma institucional.'}
                    </div>

                    ${
                      esUrgente
                        ? `
                      <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:6px;padding:14px 18px;margin-bottom:24px;">
                        <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.5;">
                          <strong>Acuse Obligatorio:</strong> Este comunicado es de lectura obligatoria. Por favor ingresa a la plataforma web o aplicacion movil para registrar tu confirmacion de lectura.
                        </p>
                      </div>
                    `
                        : ''
                    }

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:25px 0 10px;">
                      <tr>
                        <td align="center">
                          <a href="http://localhost:3000/avisos/${aviso.id}" style="display:inline-block;background:#003d7a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;">
                            Ver aviso en la plataforma
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:25px 0 0;color:#94a3b8;font-size:12px;text-align:center;">
                      Emitido por: ${aviso.autorNombre || 'Administracion de la Facultad'}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                    <p style="margin:0;color:#94a3b8;font-size:11px;">Este es un correo automatico emitido por la Plataforma Comunidad UAQ.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.enviarCorreo(destinatarios, subject, html);
  }

  /**
   * Metodo central para despachar correos reales o simularlos en consola para desarrollo.
   */
  private async enviarCorreo(
    destinatarios: string[],
    subject: string,
    html: string,
  ): Promise<{ sent: boolean; totalDestinatarios: number; error?: string }> {
    if (!this.smtpConfigurado || !this.transporter) {
      console.log('----------------------------------------------------');
      console.log(`[MailService] SIMULACION DE ENVIO DE CORREO:`);
      console.log(`Asunto:        ${subject}`);
      console.log(`Destinatarios: ${destinatarios.length} usuario(s) (${destinatarios.slice(0, 5).join(', ')}${destinatarios.length > 5 ? '...' : ''})`);
      console.log('----------------------------------------------------');
      return { sent: true, totalDestinatarios: destinatarios.length };
    }

    try {
      // Usar bcc (copia oculta) para proteger la privacidad de los correos de los alumnos
      const mailOptions = {
        from: `"Comunidad UAQ" <${this.mailUser}>`,
        to: this.mailUser,
        bcc: destinatarios,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Correo enviado exitosamente a ${destinatarios.length} destinatarios.`);
      return { sent: true, totalDestinatarios: destinatarios.length };
    } catch (error: any) {
      this.logger.error(`Error al despachar correo SMTP: ${error.message}`);
      return { sent: false, totalDestinatarios: destinatarios.length, error: error.message };
    }
  }
}
