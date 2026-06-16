import { Test, TestingModule } from '@nestjs/testing';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';

describe('EntriesController', () => {
  let controller: EntriesController;
  const mockEntriesService = {
    create: jest.fn(),
    findByHabit: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntriesController],
      providers: [
        { provide: EntriesService, useValue: mockEntriesService },
      ],
    }).compile();

    controller = module.get<EntriesController>(EntriesController);
    jest.clearAllMocks();
  });

  const mockReq = { user: { userId: 'user-uuid' } };
  const habitId = 'habit-uuid';
  const entryId = 'entry-uuid';

  describe('create', () => {
    it('should create an entry for a habit', async () => {
      const dto = { date: '2026-06-12', count: 1 };
      const expected = { id: entryId, ...dto, habitId };
      mockEntriesService.create.mockResolvedValue(expected);

      const result = await controller.create(habitId, dto, mockReq);

      expect(result).toEqual(expected);
      expect(mockEntriesService.create).toHaveBeenCalledWith(habitId, dto, 'user-uuid');
    });
  });

  describe('findByHabit', () => {
    it('should return entries for a habit', async () => {
      const entries = [{ id: entryId, date: '2026-06-12', count: 1 }];
      mockEntriesService.findByHabit.mockResolvedValue(entries);

      const result = await controller.findByHabit(habitId);

      expect(result).toEqual(entries);
      expect(mockEntriesService.findByHabit).toHaveBeenCalledWith(habitId, undefined, undefined);
    });

    it('should pass date range query params', async () => {
      const entries = [{ id: entryId, date: '2026-06-12', count: 1 }];
      mockEntriesService.findByHabit.mockResolvedValue(entries);

      const result = await controller.findByHabit(habitId, '2026-06-01', '2026-06-30');

      expect(result).toEqual(entries);
      expect(mockEntriesService.findByHabit).toHaveBeenCalledWith(habitId, '2026-06-01', '2026-06-30');
    });
  });

  describe('update', () => {
    it('should update an entry', async () => {
      const dto = { count: 3 };
      const expected = { id: entryId, count: 3 };
      mockEntriesService.update.mockResolvedValue(expected);

      const result = await controller.update(entryId, dto);

      expect(result).toEqual(expected);
      expect(mockEntriesService.update).toHaveBeenCalledWith(entryId, dto);
    });
  });

  describe('remove', () => {
    it('should delete an entry', async () => {
      mockEntriesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(entryId);

      expect(result).toBeUndefined();
      expect(mockEntriesService.remove).toHaveBeenCalledWith(entryId);
    });
  });
});
