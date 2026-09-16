import { Test, TestingModule } from '@nestjs/testing';
import { FacultadesController } from './facultades.controller';
import { FacultadesService } from './facultades.service';

describe('FacultadesController', () => {
  let controller: FacultadesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacultadesController],
      providers: [FacultadesService],
    }).compile();

    controller = module.get<FacultadesController>(FacultadesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
