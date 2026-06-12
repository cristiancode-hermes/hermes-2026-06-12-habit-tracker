import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { Insight } from './insight.entity';
import { Habit } from '../habits/habit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Insight, Habit])],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
