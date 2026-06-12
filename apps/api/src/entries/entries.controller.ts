import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EntriesService } from './entries.service';
import { CreateEntryDto, UpdateEntryDto } from './dto/create-entry.dto';
import { HabitEntry } from './habit-entry.entity';

@ApiTags('Entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post('habits/:habitId/entries')
  @ApiOperation({ summary: 'Log an entry for a habit' })
  create(@Param('habitId') habitId: string, @Body() dto: CreateEntryDto, @Req() req: any): Promise<HabitEntry> {
    return this.entriesService.create(habitId, dto, req.user.userId);
  }

  @Get('habits/:habitId/entries')
  @ApiOperation({ summary: 'Get entries for a habit' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findByHabit(
    @Param('habitId') habitId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<HabitEntry[]> {
    return this.entriesService.findByHabit(habitId, startDate, endDate);
  }

  @Put('entries/:id')
  @ApiOperation({ summary: 'Update an entry' })
  update(@Param('id') id: string, @Body() dto: UpdateEntryDto): Promise<HabitEntry> {
    return this.entriesService.update(id, dto);
  }

  @Delete('entries/:id')
  @ApiOperation({ summary: 'Delete an entry' })
  remove(@Param('id') id: string): Promise<void> {
    return this.entriesService.remove(id);
  }
}
