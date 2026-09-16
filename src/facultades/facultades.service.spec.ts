import { Test, TestingModule } from '@nestjs/testing';
import { FacultadesService } from './facultades.service';

describe('FacultadesService', () => {
  let service: FacultadesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FacultadesService],
    }).compile();

    service = module.get<FacultadesService>(FacultadesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
