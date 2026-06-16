import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return auth response', async () => {
      const dto = { email: 'test@test.com', password: 'password123' };
      const expected = {
        accessToken: 'token',
        userId: 'user-uuid',
        email: 'test@test.com',
      };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should login and return auth response', async () => {
      const dto = { email: 'test@test.com', password: 'password123' };
      const expected = {
        accessToken: 'token',
        userId: 'user-uuid',
        email: 'test@test.com',
      };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });
  });
});
