import { IsString, IsOptional, IsEnum, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { HabitFrequency } from '../habit.entity';

export class CreateHabitDto {
  @ApiProperty({ example: 'Morning Meditation' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: '10 minutes of mindfulness after waking up' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'weekdays', 'weekends'], default: 'daily' })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'weekdays', 'weekends'])
  frequency?: HabitFrequency;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  targetPerDay?: number;
}

export class UpdateHabitDto {
  @ApiPropertyOptional({ example: 'Morning Meditation' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: '10 minutes of mindfulness' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'weekdays', 'weekends'] })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'weekdays', 'weekends'])
  frequency?: HabitFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  targetPerDay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  active?: boolean;
}
