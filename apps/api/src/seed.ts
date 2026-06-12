import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { HabitsService } from './habits/habits.service';
import { EntriesService } from './entries/entries.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const authService = app.get(AuthService);
  const habitsService = app.get(HabitsService);
  const entriesService = app.get(EntriesService);

  // Create demo user
  const user = await authService.register({
    email: 'demo@example.com',
    password: 'demo123456',
  });
  console.log('Created user:', user.email, user.userId);

  // Create habits
  const habits = [
    { name: 'Morning Meditation', description: '10 minutes of mindfulness after waking', frequency: 'daily' as const, targetPerDay: 1 },
    { name: 'Read for 30 minutes', description: 'Read books on software engineering or personal growth', frequency: 'daily' as const, targetPerDay: 1 },
    { name: 'Exercise', description: 'Any physical activity for at least 20 minutes', frequency: 'daily' as const, targetPerDay: 1 },
    { name: 'Drink 8 glasses of water', description: 'Stay hydrated throughout the day', frequency: 'daily' as const, targetPerDay: 8 },
    { name: 'Weekly Planning', description: 'Plan the upcoming week every Sunday', frequency: 'weekly' as const, targetPerDay: 1 },
    { name: 'Gratitude Journal', description: 'Write 3 things you are grateful for', frequency: 'daily' as const, targetPerDay: 1 },
  ];

  const createdHabits = [];
  for (const h of habits) {
    const habit = await habitsService.create(h, user.userId);
    createdHabits.push(habit);
    console.log('  Created habit:', habit.name, habit.id);
  }

  // Create entries for the past 14 days
  const today = new Date();
  for (let day = 13; day >= 0; day--) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    for (const habit of createdHabits) {
      if (habit.name === 'Weekly Planning' && dayOfWeek !== 0) continue;

      // 80% adherence rate for realistic data
      if (Math.random() > 0.8 && day > 3) continue;

      const count = habit.name === 'Drink 8 glasses of water'
        ? Math.floor(Math.random() * 5) + 4
        : 1;

      try {
        await entriesService.create(habit.id, {
          date: dateStr,
          count,
          note: day % 3 === 0 ? 'Done!' : undefined,
        }, user.userId);
      } catch (e) {
        // Entry might already exist
      }
    }
  }
  console.log('Seed data created for 14 days');

  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
