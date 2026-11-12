import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FacultadesService } from './facultades.service';
import { Facultade } from './entities/facultade.entity';
import { User } from '../sessions/user.entity';

describe('FacultadesService', () => {
  let service: FacultadesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacultadesService,
        {
          provide: getRepositoryToken(Facultade),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FacultadesService>(FacultadesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
