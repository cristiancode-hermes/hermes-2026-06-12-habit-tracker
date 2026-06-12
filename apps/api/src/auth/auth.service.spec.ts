import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;
  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockImplementation((dto) => dto);
      mockUserRepo.save.mockImplementation((user) => ({
        ...user,
        id: 'test-uuid',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await service.register({ email: 'test@test.com', password: 'password123' });

      expect(result.accessToken).toBe('test-token');
      expect(result.email).toBe('test@test.com');
      expect(result.userId).toBe('test-uuid');
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
    });

    it('should throw ConflictException for duplicate email', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'existing', email: 'test@test.com' });

      await expect(
        service.register({ email: 'test@test.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should authenticate valid credentials', async () => {
      const salt = 'test-salt';
      const passwordHash = require('crypto')
        .pbkdf2Sync('password123', salt, 10000, 64, 'sha512')
        .toString('hex') + ':' + salt;

      mockUserRepo.findOne.mockResolvedValue({
        id: 'test-uuid',
        email: 'test@test.com',
        passwordHash,
        role: 'user',
      });

      const result = await service.login({ email: 'test@test.com', password: 'password123' });

      expect(result.accessToken).toBe('test-token');
      expect(result.email).toBe('test@test.com');
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const salt = 'test-salt';
      const passwordHash = 'wrong-hash:' + salt;

      mockUserRepo.findOne.mockResolvedValue({
        id: 'test-uuid',
        email: 'test@test.com',
        passwordHash,
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
