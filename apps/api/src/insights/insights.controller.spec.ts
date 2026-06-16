import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { Habit } from '../habits/habit.entity';

describe('InsightsController', () => {
  let controller: InsightsController;
  const mockInsightsService = {
    generateInsights: jest.fn(),
    findByUser: jest.fn(),
  };
  const mockHabitRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InsightsController],
      providers: [
        { provide: InsightsService, useValue: mockInsightsService },
        { provide: getRepositoryToken(Habit), useValue: mockHabitRepo },
      ],
    }).compile();

    controller = module.get<InsightsController>(InsightsController);
    jest.clearAllMocks();
  });

  const mockReq = { user: { userId: 'user-uuid', email: 'test@test.com' } };

  describe('generate', () => {
    it('should generate insights from habit data', async () => {
      const habits = [
        {
          id: 'habit-1',
          name: 'Exercise',
          frequency: 'daily',
          userId: 'user-uuid',
          entries: [
            { date: '2026-06-12', count: 1 },
            { date: '2026-06-11', count: 1 },
          ],
        },
      ];
      mockHabitRepo.find.mockResolvedValue(habits);

      const expectedInsights = [
        { id: 'insight-1', type: 'streak', title: 'Exercise: 2-day streak!' },
        { id: 'insight-2', type: 'summary', title: 'Weekly Performance Summary' },
      ];
      mockInsightsService.generateInsights.mockResolvedValue(expectedInsights);

      const result = await controller.generate(mockReq);

      expect(result).toEqual(expectedInsights);
      expect(mockHabitRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-uuid' },
        relations: { entries: true },
      });
      expect(mockInsightsService.generateInsights).toHaveBeenCalledWith(
        'user-uuid',
        expect.arrayContaining([
          expect.objectContaining({ id: 'habit-1', name: 'Exercise' }),
        ]),
      );
    });

    it('should handle empty habits', async () => {
      mockHabitRepo.find.mockResolvedValue([]);
      mockInsightsService.generateInsights.mockResolvedValue([]);

      const result = await controller.generate(mockReq);

      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all insights for the authenticated user', async () => {
      const insights = [
        { id: 'insight-1', type: 'streak', title: 'Test' },
      ];
      mockInsightsService.findByUser.mockResolvedValue(insights);

      const result = await controller.findAll(mockReq);

      expect(result).toEqual(insights);
      expect(mockInsightsService.findByUser).toHaveBeenCalledWith('user-uuid');
    });
  });
});
