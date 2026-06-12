import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HabitsService } from './habits.service';
import { CreateHabitDto, UpdateHabitDto } from './dto/create-habit.dto';
import { Habit } from './habit.entity';

@ApiTags('Habits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new habit' })
  create(@Body() dto: CreateHabitDto, @Req() req: any): Promise<Habit> {
    return this.habitsService.create(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all habits for current user' })
  findAll(@Req() req: any): Promise<Habit[]> {
    return this.habitsService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single habit' })
  findOne(@Param('id') id: string, @Req() req: any): Promise<Habit> {
    return this.habitsService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a habit' })
  update(@Param('id') id: string, @Body() dto: UpdateHabitDto, @Req() req: any): Promise<Habit> {
    return this.habitsService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a habit' })
  remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.habitsService.remove(id, req.user.userId);
  }
}
