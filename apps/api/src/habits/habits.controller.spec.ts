import { Test, TestingModule } from '@nestjs/testing';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';

describe('HabitsController', () => {
  let controller: HabitsController;
  const mockHabitsService = {
    create: jest.fn(),
    findAllByUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HabitsController],
      providers: [
        { provide: HabitsService, useValue: mockHabitsService },
      ],
    }).compile();

    controller = module.get<HabitsController>(HabitsController);
    jest.clearAllMocks();
  });

  const mockReq = { user: { userId: 'user-uuid', email: 'test@test.com' } };

  describe('create', () => {
    it('should create a habit', async () => {
      const dto = { name: 'Exercise' };
      const expected = { id: 'habit-uuid', ...dto, userId: 'user-uuid' };
      mockHabitsService.create.mockResolvedValue(expected);

      const result = await controller.create(dto, mockReq);

      expect(result).toEqual(expected);
      expect(mockHabitsService.create).toHaveBeenCalledWith(dto, 'user-uuid');
    });
  });

  describe('findAll', () => {
    it('should return all habits for the authenticated user', async () => {
      const habits = [{ id: '1', name: 'Test' }];
      mockHabitsService.findAllByUser.mockResolvedValue(habits);

      const result = await controller.findAll(mockReq);

      expect(result).toEqual(habits);
      expect(mockHabitsService.findAllByUser).toHaveBeenCalledWith('user-uuid');
    });
  });

  describe('findOne', () => {
    it('should return a single habit', async () => {
      const habit = { id: 'habit-uuid', name: 'Test' };
      mockHabitsService.findOne.mockResolvedValue(habit);

      const result = await controller.findOne('habit-uuid', mockReq);

      expect(result).toEqual(habit);
      expect(mockHabitsService.findOne).toHaveBeenCalledWith('habit-uuid', 'user-uuid');
    });
  });

  describe('update', () => {
    it('should update a habit', async () => {
      const dto = { name: 'Updated' };
      const expected = { id: 'habit-uuid', name: 'Updated' };
      mockHabitsService.update.mockResolvedValue(expected);

      const result = await controller.update('habit-uuid', dto, mockReq);

      expect(result).toEqual(expected);
      expect(mockHabitsService.update).toHaveBeenCalledWith('habit-uuid', dto, 'user-uuid');
    });
  });

  describe('remove', () => {
    it('should delete a habit', async () => {
      mockHabitsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('habit-uuid', mockReq);

      expect(result).toBeUndefined();
      expect(mockHabitsService.remove).toHaveBeenCalledWith('habit-uuid', 'user-uuid');
    });
  });
});
