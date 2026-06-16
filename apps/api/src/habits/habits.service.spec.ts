import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { Habit } from './habit.entity';

describe('HabitsService', () => {
  let service: HabitsService;
  const mockHabitRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HabitsService,
        { provide: getRepositoryToken(Habit), useValue: mockHabitRepo },
      ],
    }).compile();

    service = module.get<HabitsService>(HabitsService);
    jest.clearAllMocks();
  });

  const userId = 'user-uuid';
  const habitData = {
    id: 'habit-uuid',
    name: 'Morning Meditation',
    description: '10 min meditation',
    frequency: 'daily' as const,
    targetPerDay: 1,
    active: true,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a new habit', async () => {
      const dto = { name: 'Morning Meditation', description: '10 min meditation' };
      mockHabitRepo.create.mockReturnValue(habitData);
      mockHabitRepo.save.mockResolvedValue(habitData);

      const result = await service.create(dto, userId);

      expect(result).toEqual(habitData);
      expect(mockHabitRepo.create).toHaveBeenCalledWith({ ...dto, userId });
      expect(mockHabitRepo.save).toHaveBeenCalledWith(habitData);
    });

    it('should create habit with all optional fields', async () => {
      const dto = {
        name: 'Read Books',
        description: 'Read 20 pages',
        frequency: 'daily' as const,
        targetPerDay: 20,
      };
      const fullHabit = { ...habitData, ...dto };
      mockHabitRepo.create.mockReturnValue(fullHabit);
      mockHabitRepo.save.mockResolvedValue(fullHabit);

      const result = await service.create(dto, userId);

      expect(result.name).toBe('Read Books');
      expect(result.frequency).toBe('daily');
      expect(result.targetPerDay).toBe(20);
    });
  });

  describe('findAllByUser', () => {
    it('should return all habits for a user ordered by createdAt DESC', async () => {
      const habits = [habitData, { ...habitData, id: 'habit-2', name: 'Exercise' }];
      mockHabitRepo.find.mockResolvedValue(habits);

      const result = await service.findAllByUser(userId);

      expect(result).toHaveLength(2);
      expect(mockHabitRepo.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when user has no habits', async () => {
      mockHabitRepo.find.mockResolvedValue([]);

      const result = await service.findAllByUser(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a habit by id and userId', async () => {
      mockHabitRepo.findOne.mockResolvedValue({ ...habitData });

      const result = await service.findOne('habit-uuid', userId);

      expect(result).toEqual(habitData);
      expect(mockHabitRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'habit-uuid', userId },
      });
    });

    it('should throw NotFoundException when habit not found', async () => {
      mockHabitRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing habit', async () => {
      const existing = { ...habitData };
      mockHabitRepo.findOne.mockResolvedValue(existing);
      const updateDto = { name: 'Updated Name' };
      const updated = { ...existing, name: 'Updated Name' };
      mockHabitRepo.save.mockResolvedValue(updated);

      const result = await service.update('habit-uuid', updateDto, userId);

      expect(result.name).toBe('Updated Name');
      expect(mockHabitRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating non-existent habit', async () => {
      mockHabitRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Test' }, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update partial fields only', async () => {
      const existing = { ...habitData, targetPerDay: 1, name: 'Morning Meditation' };
      mockHabitRepo.findOne.mockResolvedValue(existing);
      mockHabitRepo.save.mockImplementation((h) => Promise.resolve(h));

      const result = await service.update('habit-uuid', { active: false }, userId);

      expect(result.active).toBe(false);
      expect(result.name).toBe('Morning Meditation'); // unchanged
    });
  });

  describe('remove', () => {
    it('should delete a habit successfully', async () => {
      mockHabitRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove('habit-uuid', userId);

      expect(mockHabitRepo.delete).toHaveBeenCalledWith({
        id: 'habit-uuid',
        userId,
      });
    });

    it('should throw NotFoundException when habit to delete not found', async () => {
      mockHabitRepo.delete.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.remove('nonexistent', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
