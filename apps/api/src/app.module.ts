import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { HabitsModule } from './habits/habits.module';
import { EntriesModule } from './entries/entries.module';
import { InsightsModule } from './insights/insights.module';
import { User } from './auth/user.entity';
import { Habit } from './habits/habit.entity';
import { HabitEntry } from './entries/habit-entry.entity';
import { Insight } from './insights/insight.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: (config.get<string>('DATABASE_TYPE', 'better-sqlite3') as any),
        database: config.get<string>('DATABASE_PATH', './data/habits.db'),
        // For Postgres/Neon production:
        // url: config.get<string>('DATABASE_URL'),
        entities: [User, Habit, HabitEntry, Insight],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    HabitsModule,
    EntriesModule,
    InsightsModule,
  ],
})
export class AppModule {}
