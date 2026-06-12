import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InsightsService } from './insights.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from '../habits/habit.entity';
import { Insight } from './insight.entity';

@ApiTags('Insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('insights')
export class InsightsController {
  constructor(
    private readonly insightsService: InsightsService,
    @InjectRepository(Habit)
    private readonly habitRepo: Repository<Habit>,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate AI-powered insights from habit data' })
  async generate(@Req() req: any): Promise<Insight[]> {
    const habits = await this.habitRepo.find({
      where: { userId: req.user.userId },
      relations: { entries: true },
    });

    const habitsWithEntries = habits.map((h) => ({
      id: h.id,
      name: h.name,
      frequency: h.frequency,
      entries: (h.entries || []).map((e) => ({ date: e.date, count: e.count })),
    }));

    return this.insightsService.generateInsights(req.user.userId, habitsWithEntries);
  }

  @Get()
  @ApiOperation({ summary: 'Get all generated insights' })
  findAll(@Req() req: any): Promise<Insight[]> {
    return this.insightsService.findByUser(req.user.userId);
  }
}
