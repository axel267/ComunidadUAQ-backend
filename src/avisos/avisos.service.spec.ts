import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvisosService } from './avisos.service';
import { Aviso, NivelUrgencia } from './entities/aviso.entity';
import { LecturaAviso } from './entities/lectura-aviso.entity';
import { User } from '../sessions/user.entity';
import { MailService } from '../mail/mail.service';

describe('AvisosService - Acuse de Recibo y Urgentes Pendientes', () => {
  let service: AvisosService;
  let avisoRepo: any;
  let lecturaRepo: any;
  let userRepo: any;
  let mailService: any;

  beforeEach(async () => {
    avisoRepo = {
      createQueryBuilder: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    lecturaRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    userRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mailService = {
      sendAvisoNotification: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvisosService,
        {
          provide: getRepositoryToken(Aviso),
          useValue: avisoRepo,
        },
        {
          provide: getRepositoryToken(LecturaAviso),
          useValue: lecturaRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
      ],
    }).compile();

    service = module.get<AvisosService>(AvisosService);
  });

  it('debe filtrar y devolver unicamente avisos urgentes no leidos por el usuario', async () => {
    const mockUser = { id: 10, facultades: [{ id: 1 }] };
    userRepo.findOne.mockResolvedValue(mockUser);

    const mockAvisos = [
      { id: 101, titulo: 'Aviso Urgente 1', urgencia: NivelUrgencia.URGENTE },
      { id: 102, titulo: 'Aviso Alta 2', urgencia: NivelUrgencia.ALTA },
    ];

    const qbMock: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockAvisos),
    };
    avisoRepo.createQueryBuilder.mockReturnValue(qbMock);

    // El usuario ya confirmo la lectura del aviso 101, pero el 102 esta pendiente
    lecturaRepo.find.mockResolvedValue([{ avisoId: 101, usuarioId: 10 }]);

    const pendientes = await service.obtenerAvisosUrgentesPendientes(10);
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0].id).toBe(102);
  });

  it('debe persistir el acuse y responder de forma idempotente al repetirlo', async () => {
    const aviso = { id: 101, titulo: 'Aviso urgente' };
    const usuario = { id: 10 };
    const lectura = { avisoId: 101, usuarioId: 10 };
    avisoRepo.findOne.mockResolvedValue(aviso);
    userRepo.findOne.mockResolvedValue(usuario);
    lecturaRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(lectura);
    lecturaRepo.save.mockResolvedValue(lectura);

    const primera = await service.marcarComoLeido(101, 10);
    const repetida = await service.marcarComoLeido(101, 10);

    expect(primera.yaLeido).toBe(false);
    expect(repetida.yaLeido).toBe(true);
    expect(lecturaRepo.save).toHaveBeenCalledTimes(1);
  });

  it('debe enviar notificacion por correo al crear un aviso urgente', async () => {
    const adminUser = {
      id: 1,
      nombre: 'Administrador UAQ',
      rolId: 1,
      rol: { nombre: 'Administrador' },
      facultades: [],
      estadoActivo: true,
    };

    userRepo.findOne.mockResolvedValue(adminUser);

    const queryMock: any = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        { email: 'alumno1@alumnos.uaq.mx' },
        { email: 'docente1@uaq.mx' },
      ]),
    };
    userRepo.createQueryBuilder.mockReturnValue(queryMock);

    const dto = {
      titulo: 'Suspensión de clases por contingencia',
      contenido: 'Se suspenden actividades presenciales el día de hoy.',
      urgencia: NivelUrgencia.URGENTE,
      autorId: 1,
    };

    const creado = await service.create(dto as any, 1, adminUser as any);
    expect(creado).toBeDefined();
    expect(mailService.sendAvisoNotification).toHaveBeenCalledTimes(1);
    expect(mailService.sendAvisoNotification).toHaveBeenCalledWith(
      ['alumno1@alumnos.uaq.mx', 'docente1@uaq.mx'],
      expect.objectContaining({
        titulo: 'Suspensión de clases por contingencia',
      }),
    );
  });
});

