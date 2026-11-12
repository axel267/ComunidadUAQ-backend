import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService (Notificaciones por Correo Institucional)', () => {
  let service: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'SMTP_HOST') return 'smtp.gmail.com';
              if (key === 'SMTP_PORT') return 587;
              if (key === 'SMTP_USER') return 'notificaciones@uaq.mx';
              if (key === 'SMTP_PASSWORD') return 'secret';
              if (key === 'MAIL_USER') return 'notificaciones@uaq.mx';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe procesar el envio de aviso urgente a multiples destinatarios sin errores', async () => {
    const mockDestinatarios = [
      'alumno1@alumnos.uaq.mx',
      'alumno2@alumnos.uaq.mx',
      'docente@uaq.mx',
    ];

    const mockAviso = {
      id: 1,
      titulo: 'Suspension de actividades presenciales',
      contenido: 'Se suspenden clases presenciales por contingencia.',
      urgencia: 'URGENTE',
      facultadNombre: 'Facultad de Informatica',
      autorNombre: 'Direccion FIF',
    };

    const resultado = await service.sendAvisoNotification(mockDestinatarios, mockAviso);
    expect(resultado.totalDestinatarios).toBe(3);
  });

  it('no debe fallar si la lista de destinatarios esta vacia', async () => {
    const mockAviso = {
      id: 2,
      titulo: 'Aviso general',
      urgencia: 'BAJA',
    };

    const resultado = await service.sendAvisoNotification([], mockAviso);
    expect(resultado.totalDestinatarios).toBe(0);
    expect(resultado.sent).toBe(true);
  });
});

