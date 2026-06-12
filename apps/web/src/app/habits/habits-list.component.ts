import { Component, signal, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Habit } from '../shared/api.service';

@Component({
  selector: 'app-habits-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">My Habits</h1>
        <button (click)="showForm.set(true)" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">
          + New Habit
        </button>
      </div>

      <!-- New habit form -->
      @if (showForm()) {
        <div class="bg-white rounded-xl shadow-sm border p-6">
          <h2 class="text-lg font-semibold mb-4">Create Habit</h2>
          @if (formError()) {
            <div class="mb-3 p-2 bg-red-50 text-red-700 rounded text-sm">{{ formError() }}</div>
          }
          <form (ngSubmit)="createHabit()" class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" [(ngModel)]="newName" name="name" required
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="e.g., Morning Meditation">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input type="text" [(ngModel)]="newDescription" name="description"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Describe your habit">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select [(ngModel)]="newFrequency" name="frequency"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Target per day</label>
                <input type="number" [(ngModel)]="newTarget" name="target" min="1"
                  class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              </div>
            </div>
            <div class="flex gap-2 pt-2">
              <button type="submit" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">Create</button>
              <button type="button" (click)="showForm.set(false)" class="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      }

      <!-- Habits list -->
      @if (loading()) {
        <div class="text-center py-12 text-gray-400">Loading...</div>
      } @else if (habits().length === 0) {
        <div class="text-center py-12 text-gray-400">
          <p class="text-lg">No habits yet</p>
          <p class="text-sm mt-1">Create your first habit to get started!</p>
        </div>
      } @else {
        <div class="grid gap-3">
          @for (habit of habits(); track habit.id) {
            <div class="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between hover:border-gray-300 transition-colors">
              <div>
                <a [routerLink]="['/habits', habit.id]" class="font-medium text-gray-900 hover:text-primary-600">{{ habit.name }}</a>
                <div class="text-xs text-gray-500 mt-0.5">
                  {{ habit.frequency }} &middot; target {{ habit.targetPerDay }}/day
                  @if (!habit.active) { <span class="text-red-500 ml-2">(paused)</span> }
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button (click)="toggleActive(habit)" class="text-xs px-2 py-1 rounded-full border"
                  [class.bg-green-50]="habit.active" [class.text-green-700]="habit.active"
                  [class.bg-gray-50]="!habit.active" [class.text-gray-500]="!habit.active">
                  {{ habit.active ? 'Active' : 'Paused' }}
                </button>
                <button (click)="deleteHabit(habit)" class="text-xs text-red-500 hover:text-red-700 px-2 py-1">Delete</button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class HabitsListComponent implements OnInit {
  habits = signal<Habit[]>([]);
  loading = signal(true);
  showForm = signal(false);
  formError = signal('');

  newName = '';
  newDescription = '';
  newFrequency = 'daily';
  newTarget = 1;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadHabits();
  }

  private loadHabits() {
    this.api.getHabits().subscribe({
      next: (habits) => {
        this.habits.set(habits);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createHabit() {
    if (!this.newName.trim()) return;
    this.formError.set('');
    this.api.createHabit({
      name: this.newName.trim(),
      description: this.newDescription.trim() || undefined,
      frequency: this.newFrequency as any,
      targetPerDay: this.newTarget,
    }).subscribe({
      next: (habit) => {
        this.habits.update(h => [habit, ...h]);
        this.showForm.set(false);
        this.newName = '';
        this.newDescription = '';
        this.newFrequency = 'daily';
        this.newTarget = 1;
      },
      error: (err) => {
        this.formError.set(err.error?.message || 'Failed to create habit');
      },
    });
  }

  toggleActive(habit: Habit) {
    this.api.updateHabit(habit.id, { active: !habit.active }).subscribe({
      next: () => {
        this.habits.update(h => h.map(x => x.id === habit.id ? { ...x, active: !x.active } : x));
      },
    });
  }

  deleteHabit(habit: Habit) {
    if (!confirm(`Delete "${habit.name}"? This will also remove all entries.`)) return;
    this.api.deleteHabit(habit.id).subscribe({
      next: () => {
        this.habits.update(h => h.filter(x => x.id !== habit.id));
      },
    });
  }
}
