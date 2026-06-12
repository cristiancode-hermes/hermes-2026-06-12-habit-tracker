import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../auth/user.entity';
import { HabitEntry } from '../entries/habit-entry.entity';

export type HabitFrequency = 'daily' | 'weekly' | 'weekdays' | 'weekends';

@Entity('habits')
export class Habit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'daily' })
  frequency: HabitFrequency;

  @Column({ default: 1 })
  targetPerDay: number;

  @Column({ default: true })
  active: boolean;

  @Column()
  userId: string;

  @ManyToOne(() => User, (u) => u.habits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => HabitEntry, (e) => e.habit)
  entries: HabitEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
