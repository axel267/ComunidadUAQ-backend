import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ServiceUnavailableException } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { User } from './user.entity';
import { SessionsService } from './sessions.service';

describe('SessionsService account creation', () => {
  let service: SessionsService;
  const usersRepository = {
    findOne: jest.fn(),
    create: jest.fn((user) => user),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const mailService = {
    sendWelcomePassword: jest.fn(),
  };

  beforeEach(async () => {
    usersRepository.findOne.mockResolvedValue(null);
    usersRepository.save.mockImplementation(async (user) => ({ ...user, id: 12 }));
    usersRepository.delete.mockResolvedValue({ affected: 1 });
    mailService.sendWelcomePassword.mockResolvedValue({ sent: true });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: MailService, useValue: mailService },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends the temporary password by email without returning it to the caller', async () => {
    const response = await service.createAccount(
      123456,
      'student@alumnos.uaq.mx',
      'Student UAQ',
      [],
      2,
      undefined,
      undefined,
      { campus: 'Campus Juriquilla' },
    );

    expect(mailService.sendWelcomePassword).toHaveBeenCalledWith(
      'student@alumnos.uaq.mx',
      'Student UAQ',
      expect.any(String),
    );
    expect(response).not.toHaveProperty('temporaryPassword');
    expect(response.user).toMatchObject({
      campus: 'Campus Juriquilla',
      carrera: null,
    });
  });

  it('removes the account and reports failure when the password email was not sent', async () => {
    mailService.sendWelcomePassword.mockResolvedValue({
      sent: false,
      error: 'SMTP no está configurado.',
    });

    await expect(
      service.createAccount(123456, 'student@alumnos.uaq.mx', 'Student UAQ', [], 2),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(usersRepository.delete).toHaveBeenCalledWith(12);
  });
});
