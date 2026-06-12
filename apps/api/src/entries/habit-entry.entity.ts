import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Habit } from '../habits/habit.entity';

@Entity('habit_entries')
export class HabitEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: 1 })
  count: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column()
  habitId: string;

  @ManyToOne(() => Habit, (h) => h.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'habitId' })
  habit: Habit;

  @CreateDateColumn()
  createdAt: Date;
}
