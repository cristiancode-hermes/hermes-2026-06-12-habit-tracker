import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { HabitEntry } from './habit-entry.entity';
import { CreateEntryDto, UpdateEntryDto } from './dto/create-entry.dto';

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(HabitEntry)
    private readonly entryRepo: Repository<HabitEntry>,
  ) {}

  async create(habitId: string, dto: CreateEntryDto, userId: string): Promise<HabitEntry> {
    const existing = await this.entryRepo.findOne({
      where: { habitId, date: dto.date },
      relations: { habit: true },
    });
    if (existing) {
      existing.count += dto.count ?? 1;
      if (dto.note) existing.note = dto.note;
      return this.entryRepo.save(existing);
    }
    const entry = this.entryRepo.create({ habitId, ...dto });
    return this.entryRepo.save(entry);
  }

  async findByHabit(habitId: string, startDate?: string, endDate?: string): Promise<HabitEntry[]> {
    const where: any = { habitId };
    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }
    return this.entryRepo.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<HabitEntry> {
    const entry = await this.entryRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Entry not found');
    return entry;
  }

  async update(id: string, dto: UpdateEntryDto): Promise<HabitEntry> {
    const entry = await this.findOne(id);
    Object.assign(entry, dto);
    return this.entryRepo.save(entry);
  }

  async remove(id: string): Promise<void> {
    const result = await this.entryRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Entry not found');
  }
}
