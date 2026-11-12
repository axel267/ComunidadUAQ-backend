import { Test, TestingModule } from '@nestjs/testing';
import { FacultadesController } from './facultades.controller';
import { FacultadesService } from './facultades.service';

describe('FacultadesController', () => {
  let controller: FacultadesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacultadesController],
      providers: [
        {
          provide: FacultadesService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FacultadesController>(FacultadesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
