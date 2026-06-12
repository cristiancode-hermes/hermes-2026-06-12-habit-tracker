import { Component, signal, computed, effect, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Habit, HabitEntry } from '../shared/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>

      <!-- Quick log -->
      <div class="bg-white rounded-xl shadow-sm border p-4">
        <h2 class="text-sm font-semibold text-gray-700 mb-3">Quick Log Today</h2>
        <form (ngSubmit)="quickLog()" class="flex gap-3 items-end">
          <div class="flex-1">
            <select [(ngModel)]="selectedHabitId" name="habitId" required
              class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">Select a habit...</option>
              @for (h of habits(); track h.id) {
                <option [value]="h.id">{{ h.name }}</option>
              }
            </select>
          </div>
          <button type="submit" [disabled]="!selectedHabitId()"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium transition-colors">
            Log
          </button>
        </form>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl shadow-sm border p-4 text-center">
          <div class="text-3xl font-bold text-primary-600">{{ habits().length }}</div>
          <div class="text-sm text-gray-500">Active Habits</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border p-4 text-center">
          <div class="text-3xl font-bold text-green-600">{{ activeStreaks() }}</div>
          <div class="text-sm text-gray-500">Active Streaks</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border p-4 text-center">
          <div class="text-3xl font-bold text-purple-600">{{ insights().length }}</div>
          <div class="text-sm text-gray-500">Insights</div>
        </div>
      </div>

      <!-- Habits overview -->
      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Your Habits</h2>
        @if (loading()) {
          <div class="text-center py-8 text-gray-400">Loading...</div>
        } @else if (habits().length === 0) {
          <div class="text-center py-8 text-gray-400">
            <p>No habits yet.</p>
            <a routerLink="/habits" class="text-primary-600 hover:underline text-sm">Create your first habit</a>
          </div>
        } @else {
          <div class="grid gap-3">
            @for (habit of habits(); track habit.id) {
              <a [routerLink]="['/habits', habit.id]" class="bg-white rounded-xl shadow-sm border p-4 hover:border-primary-300 transition-colors block">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-gray-900">{{ habit.name }}</div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ habit.frequency }} &middot; target {{ habit.targetPerDay }}/day</div>
                  </div>
                  <div class="text-xs px-2 py-1 rounded-full" [class.bg-green-100]="getStreak(habit.id) > 0" [class.text-green-700]="getStreak(habit.id) > 0"
                    [class.bg-gray-100]="getStreak(habit.id) === 0" [class.text-gray-500]="getStreak(habit.id) === 0">
                    {{ getStreak(habit.id) > 0 ? getStreak(habit.id) + ' day streak' : 'No streak' }}
                  </div>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  habits = signal<Habit[]>([]);
  insights = signal<any[]>([]);
  loading = signal(true);
  selectedHabitId = signal('');

  // Track streaks per habit (dictionary)
  streaks = signal<Record<string, number>>({});

  activeStreaks = computed(() =>
    Object.entries(this.streaks()).filter(([_, v]) => v > 0).length
  );

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.api.getHabits().subscribe({
      next: (habits) => {
        this.habits.set(habits);
        this.loading.set(false);
        // Load entries for streak calculation
        habits.forEach(h => this.loadEntriesForHabit(h.id));
      },
      error: () => this.loading.set(false),
    });

    this.api.getInsights().subscribe({
      next: (insights) => this.insights.set(insights),
    });
  }

  private loadEntriesForHabit(habitId: string) {
    this.api.getEntries(habitId).subscribe({
      next: (entries) => {
        if (entries.length === 0) return;
        // Compute streak
        const sortedDates = entries
          .map(e => e.date)
          .sort()
          .reverse();

        let streak = 0;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Check if last entry was today or yesterday
        const lastDate = sortedDates[0];
        if (lastDate) {
          const diffDays = Math.floor((today.getTime() - new Date(lastDate).getTime()) / (1000*60*60*24));
          if (diffDays <= 1) {
            streak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
              const curr = new Date(sortedDates[i-1]);
              const prev = new Date(sortedDates[i]);
              const d = Math.round((curr.getTime() - prev.getTime()) / (1000*60*60*24));
              if (d <= 1) streak++;
              else break;
            }
          }
        }
        this.streaks.update(s => ({ ...s, [habitId]: streak }));
      },
    });
  }

  getStreak(habitId: string): number {
    return this.streaks()[habitId] || 0;
  }

  quickLog() {
    const habitId = this.selectedHabitId();
    if (!habitId) return;
    const today = new Date().toISOString().split('T')[0];
    this.api.createEntry(habitId, { date: today, count: 1 }).subscribe({
      next: () => {
        this.selectedHabitId.set('');
        this.loadEntriesForHabit(habitId);
      },
    });
  }
}
