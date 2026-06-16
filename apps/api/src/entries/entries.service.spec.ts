import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { HabitEntry } from './habit-entry.entity';

describe('EntriesService', () => {
  let service: EntriesService;
  const mockEntryRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntriesService,
        { provide: getRepositoryToken(HabitEntry), useValue: mockEntryRepo },
      ],
    }).compile();

    service = module.get<EntriesService>(EntriesService);
    jest.clearAllMocks();
  });

  const userId = 'user-uuid';
  const habitId = 'habit-uuid';
  const baseEntry: HabitEntry = {
    id: 'entry-uuid',
    date: '2026-06-12',
    count: 1,
    note: 'Felt great',
    habitId,
    createdAt: new Date(),
  } as HabitEntry;

  describe('create', () => {
    it('should create a new entry when no existing entry for that date', async () => {
      mockEntryRepo.findOne.mockResolvedValue(null);
      mockEntryRepo.create.mockReturnValue(baseEntry);
      mockEntryRepo.save.mockResolvedValue(baseEntry);

      const result = await service.create(habitId, { date: '2026-06-12', count: 1, note: 'Felt great' }, userId);

      expect(result).toEqual(baseEntry);
      expect(mockEntryRepo.create).toHaveBeenCalledWith({ habitId, date: '2026-06-12', count: 1, note: 'Felt great' });
    });

    it('should increment count when an entry already exists for that date', async () => {
      const existing = { ...baseEntry, count: 1 };
      mockEntryRepo.findOne.mockResolvedValue(existing);
      mockEntryRepo.save.mockResolvedValue({ ...existing, count: 3 });

      const result = await service.create(habitId, { date: '2026-06-12', count: 2 }, userId);

      expect(result.count).toBe(3);
      expect(mockEntryRepo.save).toHaveBeenCalledWith({ ...existing, count: 3, note: 'Felt great' });
    });

    it('should update note when incrementing existing entry with note', async () => {
      const existing = { ...baseEntry, count: 1, note: 'Old note' };
      mockEntryRepo.findOne.mockResolvedValue(existing);
      mockEntryRepo.save.mockResolvedValue({ ...existing, count: 2, note: 'New note' });

      const result = await service.create(habitId, { date: '2026-06-12', count: 1, note: 'New note' }, userId);

      expect(result.note).toBe('New note');
    });
  });

  describe('findByHabit', () => {
    it('should return entries for a habit ordered by date DESC', async () => {
      const entries = [baseEntry];
      mockEntryRepo.find.mockResolvedValue(entries);

      const result = await service.findByHabit(habitId);

      expect(result).toEqual(entries);
      expect(mockEntryRepo.find).toHaveBeenCalledWith({
        where: { habitId },
        order: { date: 'DESC' },
      });
    });

    it('should filter entries by date range when provided', async () => {
      const entries = [baseEntry];
      mockEntryRepo.find.mockResolvedValue(entries);

      const result = await service.findByHabit(habitId, '2026-06-01', '2026-06-30');

      expect(result).toEqual(entries);
      expect(mockEntryRepo.find).toHaveBeenCalledWith({
        where: { habitId, date: expect.any(Object) },
        order: { date: 'DESC' },
      });
    });

    it('should return empty array when no entries exist', async () => {
      mockEntryRepo.find.mockResolvedValue([]);

      const result = await service.findByHabit(habitId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an entry by id', async () => {
      mockEntryRepo.findOne.mockResolvedValue(baseEntry);

      const result = await service.findOne('entry-uuid');

      expect(result).toEqual(baseEntry);
      expect(mockEntryRepo.findOne).toHaveBeenCalledWith({ where: { id: 'entry-uuid' } });
    });

    it('should throw NotFoundException when entry not found', async () => {
      mockEntryRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an existing entry', async () => {
      mockEntryRepo.findOne.mockResolvedValue(baseEntry);
      const updated = { ...baseEntry, count: 5, note: 'Updated note' };
      mockEntryRepo.save.mockResolvedValue(updated);

      const result = await service.update('entry-uuid', { count: 5, note: 'Updated note' });

      expect(result.count).toBe(5);
      expect(result.note).toBe('Updated note');
    });

    it('should throw NotFoundException when updating non-existent entry', async () => {
      mockEntryRepo.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { count: 1 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an entry successfully', async () => {
      mockEntryRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove('entry-uuid');

      expect(mockEntryRepo.delete).toHaveBeenCalledWith('entry-uuid');
    });

    it('should throw NotFoundException when entry to delete not found', async () => {
      mockEntryRepo.delete.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
