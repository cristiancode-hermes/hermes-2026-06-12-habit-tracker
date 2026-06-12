import { Component, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Habit, HabitEntry } from '../shared/api.service';

@Component({
  selector: 'app-habit-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <a routerLink="/habits" class="text-gray-400 hover:text-gray-600">&larr; Back</a>
        <h1 class="text-2xl font-bold text-gray-900">{{ habit()?.name || 'Habit' }}</h1>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-400">Loading...</div>
      } @else if (habit(); as h) {
        <!-- Info -->
        <div class="bg-white rounded-xl shadow-sm border p-4">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-lg font-bold text-primary-600">{{ h.frequency }}</div>
              <div class="text-xs text-gray-500">Frequency</div>
            </div>
            <div>
              <div class="text-lg font-bold text-green-600">{{ streak() }} days</div>
              <div class="text-xs text-gray-500">Current Streak</div>
            </div>
            <div>
              <div class="text-lg font-bold text-purple-600">{{ totalEntries() }}</div>
              <div class="text-xs text-gray-500">Total Entries</div>
            </div>
          </div>
          @if (h.description) {
            <p class="mt-3 text-sm text-gray-600">{{ h.description }}</p>
          }
        </div>

        <!-- Log entry -->
        <div class="bg-white rounded-xl shadow-sm border p-4">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Log Entry</h2>
          <form (ngSubmit)="logEntry()" class="flex gap-3 items-end">
            <div>
              <input type="date" [(ngModel)]="logDate" name="logDate" required
                class="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            </div>
            <div>
              <input type="number" [(ngModel)]="logCount" name="logCount" min="1"
                class="px-3 py-2 border rounded-lg text-sm w-20 focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Count">
            </div>
            <button type="submit" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">
              Log
            </button>
          </form>
        </div>

        <!-- Recent entries -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 mb-3">Recent Entries</h2>
          @if (entries().length === 0) {
            <p class="text-sm text-gray-400">No entries yet.</p>
          } @else {
            <div class="space-y-2">
              @for (entry of entries().slice(0, 30); track entry.id) {
                <div class="bg-white rounded-lg border px-4 py-2 flex items-center justify-between">
                  <div>
                    <span class="text-sm font-medium text-gray-900">{{ entry.date }}</span>
                    @if (entry.note) {
                      <span class="text-xs text-gray-500 ml-2">{{ entry.note }}</span>
                    }
                  </div>
                  <span class="text-sm" [class.text-green-600]="entry.count > 0">{{ entry.count }}x</span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class HabitDetailComponent implements OnInit {
  habit = signal<Habit | null>(null);
  entries = signal<HabitEntry[]>([]);
  loading = signal(true);
  logDate = new Date().toISOString().split('T')[0];
  logCount = 1;

  streak = computed(() => {
    const sorted = this.entries()
      .map(e => e.date)
      .sort()
      .reverse();
    if (sorted.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    const lastDate = sorted[0];
    const diffDays = Math.floor((today.getTime() - new Date(lastDate).getTime()) / (1000*60*60*24));
    if (diffDays <= 1) {
      streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const curr = new Date(sorted[i-1]);
        const prev = new Date(sorted[i]);
        const d = Math.round((curr.getTime() - prev.getTime()) / (1000*60*60*24));
        if (d <= 1) streak++;
        else break;
      }
    }
    return streak;
  });

  totalEntries = computed(() => this.entries().length);

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getHabit(id).subscribe({
        next: (habit) => {
          this.habit.set(habit);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
      this.api.getEntries(id).subscribe({
        next: (entries) => this.entries.set(entries),
      });
    }
  }

  logEntry() {
    const h = this.habit();
    if (!h) return;
    this.api.createEntry(h.id, { date: this.logDate, count: this.logCount }).subscribe({
      next: (entry) => {
        this.entries.update(e => [entry, ...e]);
        this.logDate = new Date().toISOString().split('T')[0];
        this.logCount = 1;
      },
    });
  }
}
