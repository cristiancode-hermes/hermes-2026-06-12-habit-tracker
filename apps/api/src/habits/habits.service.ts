import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from './habit.entity';
import { CreateHabitDto, UpdateHabitDto } from './dto/create-habit.dto';

@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit)
    private readonly habitRepo: Repository<Habit>,
  ) {}

  async create(dto: CreateHabitDto, userId: string): Promise<Habit> {
    const habit = this.habitRepo.create({ ...dto, userId });
    return this.habitRepo.save(habit);
  }

  async findAllByUser(userId: string): Promise<Habit[]> {
    return this.habitRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Habit> {
    const habit = await this.habitRepo.findOne({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');
    return habit;
  }

  async update(id: string, dto: UpdateHabitDto, userId: string): Promise<Habit> {
    const habit = await this.findOne(id, userId);
    Object.assign(habit, dto);
    return this.habitRepo.save(habit);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.habitRepo.delete({ id, userId });
    if (result.affected === 0) throw new NotFoundException('Habit not found');
  }
}
