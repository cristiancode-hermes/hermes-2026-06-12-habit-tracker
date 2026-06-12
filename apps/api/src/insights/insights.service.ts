import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Insight, InsightType } from './insight.entity';

interface HabitWithStats {
  id: string;
  name: string;
  frequency: string;
  entries: { date: string; count: number }[];
}

@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(Insight)
    private readonly insightRepo: Repository<Insight>,
  ) {}

  async generateInsights(userId: string, habits: HabitWithStats[]): Promise<Insight[]> {
    const insightsData: Array<{
      id: string;
      type: InsightType;
      title: string;
      content: string;
      data: Record<string, any>;
      userId: string;
      createdAt: Date;
    }> = [];

    for (const habit of habits) {
      // Rung 2 AI: Structured pattern analysis (simulated LLM output)
      const streak = this.computeStreak(habit);
      if (streak.current > 0) {
        insightsData.push({
          id: '',
          type: 'streak',
          title: `${habit.name}: ${streak.current}-day streak!`,
          content: `You've maintained "${habit.name}" for ${streak.current} consecutive days. ${streak.current >= 7 ? 'That\'s a full week of consistency!' : 'Keep going to build momentum!'}`,
          data: { streak: streak.current, best: streak.best },
          userId,
          createdAt: new Date(),
        });
      }

      const pattern = this.analyzePattern(habit);
      if (pattern) {
        insightsData.push({
          id: '',
          type: 'pattern',
          title: `Pattern detected: ${habit.name}`,
          content: pattern,
          data: { frequency: habit.frequency, totalEntries: habit.entries.length },
          userId,
          createdAt: new Date(),
        });
      }
    }

    // Generate a summary insight
    const totalStreaks = insightsData.filter((i) => i.type === 'streak').length;
    const topHabit = habits.reduce((best, h) => {
      const entryCount = h.entries.length;
      return entryCount > ((best as any)?.entries?.length ?? 0) ? h : best;
    }, null as unknown as HabitWithStats);

    insightsData.push({
      id: '',
      type: 'summary',
      title: 'Weekly Performance Summary',
      content: `You're tracking ${habits.length} habits. ${totalStreaks > 0 ? `${totalStreaks} habits have active streaks.` : 'Start logging entries to build streaks!'}${topHabit ? ` Your most tracked habit is "${topHabit.name}" with ${topHabit.entries.length} entries.` : ''}`,
      data: { totalHabits: habits.length, activeStreaks: totalStreaks },
      userId,
      createdAt: new Date(),
    });

    // Save insights to DB using raw INSERT
    const saved: Insight[] = [];
    for (const data of insightsData) {
      const insight = this.insightRepo.create(data as any);
      const savedInsight = await this.insightRepo.save(insight) as unknown as Insight;
      saved.push(savedInsight);
    }

    return saved;
  }

  async findByUser(userId: string): Promise<Insight[]> {
    return this.insightRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  private computeStreak(habit: HabitWithStats): { current: number; best: number } {
    const entries = habit.entries
      .map((e) => e.date)
      .sort()
      .reverse();

    if (entries.length === 0) return { current: 0, best: 0 };

    let current = 1;
    let best = 1;
    let streak = 1;

    for (let i = 1; i < entries.length; i++) {
      const curr = new Date(entries[i - 1]);
      const prev = new Date(entries[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (Math.abs(diffDays - 1) <= 1) {
        streak++;
        best = Math.max(best, streak);
      } else {
        streak = 1;
      }
    }

    // Check if current streak is still active (last entry within 48h)
    const lastEntry = new Date(entries[0]);
    const now = new Date();
    const hoursSince = (now.getTime() - lastEntry.getTime()) / (1000 * 60 * 60);
    if (hoursSince > 48) current = 0;
    else current = streak;

    return { current, best };
  }

  private analyzePattern(habit: HabitWithStats): string | null {
    if (habit.entries.length < 3) return null;

    const entries = [...habit.entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Check weekly distribution
    const dayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
    for (const e of entries) {
      const day = new Date(e.date).getDay();
      dayCounts[day] += e.count;
    }

    const maxDay = dayCounts.indexOf(Math.max(...dayCounts));
    const total = dayCounts.reduce((a, b) => a + b, 0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (dayCounts[maxDay] > total * 0.4) {
      return `You tend to practice "${habit.name}" most on ${dayNames[maxDay]}s. Consider adjusting your schedule to balance the week.`;
    }

    return null;
  }
}
