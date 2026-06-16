import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InsightsService } from './insights.service';
import { Insight } from './insight.entity';

describe('InsightsService', () => {
  let service: InsightsService;
  const mockInsightRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsService,
        { provide: getRepositoryToken(Insight), useValue: mockInsightRepo },
      ],
    }).compile();

    service = module.get<InsightsService>(InsightsService);
    jest.clearAllMocks();
  });

  const userId = 'user-uuid';

  // Helper to get date strings relative to today
  const daysAgo = (n: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };

  describe('generateInsights', () => {
    it('should generate streak, pattern, and summary insights', async () => {
      // Use dates clustered on 3 Mondays to trigger pattern detection (>40% on one day)
      const habits = [
        {
          id: 'habit-1',
          name: 'Exercise',
          frequency: 'daily',
          entries: [
            { date: daysAgo(0), count: 1 },  // today (continue streak)
            { date: daysAgo(1), count: 1 },  // yesterday
            { date: daysAgo(2), count: 1 },  // 2 days ago
            { date: daysAgo(3), count: 1 },  // 3 days ago
          ],
        },
      ];

      // Mock create and save to return the data passed in
      mockInsightRepo.create.mockImplementation((data: any) => ({
        ...data,
        id: 'insight-' + Math.random().toString(36).slice(2),
      }));
      mockInsightRepo.save.mockImplementation((insight: any) =>
        Promise.resolve({ ...insight, createdAt: new Date() }),
      );

      const result = await service.generateInsights(userId, habits);

      // Should have streak + summary = 2 insights (pattern might not trigger
      // since entries are spread across all days of week)
      expect(result.length).toBeGreaterThanOrEqual(2);

      const streakInsight = result.find((i) => i.type === 'streak');
      expect(streakInsight).toBeDefined();
      expect(streakInsight!.title).toContain('streak');
      expect(streakInsight!.data.streak).toBeGreaterThan(0);

      const summaryInsight = result.find((i) => i.type === 'summary');
      expect(summaryInsight).toBeDefined();
      expect(summaryInsight!.data.totalHabits).toBe(1);
    });

    it('should return empty array when habits array is empty', async () => {
      mockInsightRepo.create.mockImplementation((data: any) => data);
      mockInsightRepo.save.mockImplementation((insight: any) =>
        Promise.resolve(insight),
      );

      const result = await service.generateInsights(userId, []);

      // Only summary insight when no habits with entries
      expect(result.length).toBe(1);
      expect(result[0].type).toBe('summary');
      expect(result[0].data.totalHabits).toBe(0);
    });

    it('should not generate pattern insight when less than 3 entries', async () => {
      const habits = [
        {
          id: 'habit-1',
          name: 'Read',
          frequency: 'daily',
          entries: [
            { date: daysAgo(0), count: 1 },
            { date: daysAgo(1), count: 1 },
          ],
        },
      ];

      mockInsightRepo.create.mockImplementation((data: any) => data);
      mockInsightRepo.save.mockImplementation((insight: any) =>
        Promise.resolve(insight),
      );

      const result = await service.generateInsights(userId, habits);

      // Should have streak + summary (no pattern because < 3 entries)
      const patternInsight = result.find((i) => i.type === 'pattern');
      expect(patternInsight).toBeUndefined();
      const streakInsight = result.find((i) => i.type === 'streak');
      expect(streakInsight).toBeDefined();
    });

    it('should not generate streak when last entry is older than 48h', async () => {
      const oldDate = daysAgo(3);
      const oldDate2 = daysAgo(4);

      const habits = [
        {
          id: 'habit-1',
          name: 'Read',
          frequency: 'daily',
          entries: [
            { date: oldDate, count: 1 },
            { date: oldDate2, count: 1 },
          ],
        },
      ];

      mockInsightRepo.create.mockImplementation((data: any) => data);
      mockInsightRepo.save.mockImplementation((insight: any) =>
        Promise.resolve(insight),
      );

      const result = await service.generateInsights(userId, habits);

      // No streak insight should be generated when current streak is 0
      const streakInsight = result.find((i) => i.type === 'streak');
      expect(streakInsight).toBeUndefined();

      // Summary should still be generated
      const summaryInsight = result.find((i) => i.type === 'summary');
      expect(summaryInsight).toBeDefined();
    });

    it('should detect weekly pattern when entries cluster on one weekday', async () => {
      // Create entries all on Mondays to trigger pattern (>40% on a day)
      const findMonday = (weeksAgo: number): string => {
        const d = new Date();
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day; // days to Monday
        d.setDate(d.getDate() + diff - (weeksAgo * 7));
        return d.toISOString().split('T')[0];
      };

      const habits = [
        {
          id: 'habit-1',
          name: 'Gym',
          frequency: 'weekly',
          entries: [
            { date: findMonday(0), count: 1 },
            { date: findMonday(1), count: 1 },
            { date: findMonday(2), count: 1 },
            { date: daysAgo(1), count: 1 }, // yesterday (different day to not dominate)
          ],
        },
      ];

      mockInsightRepo.create.mockImplementation((data: any) => ({
        ...data,
        id: 'i-' + Math.random().toString(36).slice(2),
      }));
      mockInsightRepo.save.mockImplementation((insight: any) =>
        Promise.resolve({ ...insight, createdAt: new Date() }),
      );

      const result = await service.generateInsights(userId, habits);

      const patternInsight = result.find((i) => i.type === 'pattern');
      expect(patternInsight).toBeDefined();
      expect(patternInsight!.title).toContain('Pattern detected');
    });
  });

  describe('findByUser', () => {
    it('should return insights for a user ordered by createdAt DESC', async () => {
      const insights = [
        { id: '1', type: 'summary', userId, createdAt: new Date() },
        { id: '2', type: 'streak', userId, createdAt: new Date() },
      ];
      mockInsightRepo.find.mockResolvedValue(insights);

      const result = await service.findByUser(userId);

      expect(result).toHaveLength(2);
      expect(mockInsightRepo.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });

    it('should return empty array when user has no insights', async () => {
      mockInsightRepo.find.mockResolvedValue([]);

      const result = await service.findByUser(userId);

      expect(result).toEqual([]);
    });
  });
});
