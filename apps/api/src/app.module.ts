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
      useFactory: (config: ConfigService) => {
        const dbType = config.get<string>('DATABASE_TYPE', 'better-sqlite3');
        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            url: config.get<string>('DATABASE_URL'),
            entities: [User, Habit, HabitEntry, Insight],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
          };
        }
        return {
          type: 'better-sqlite3',
          database: config.get<string>('DATABASE_PATH', './data/habits.db'),
          entities: [User, Habit, HabitEntry, Insight],
          synchronize: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    HabitsModule,
    EntriesModule,
    InsightsModule,
  ],
})
export class AppModule {}
