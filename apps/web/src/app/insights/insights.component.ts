import { Component, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService, Insight } from '../shared/api.service';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">AI Insights</h1>
        <button (click)="generate()" [disabled]="generating()"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors">
          {{ generating() ? 'Generating...' : 'Generate Insights' }}
        </button>
      </div>

      @if (loading()) {
        <div class="text-center py-12 text-gray-400">Loading insights...</div>
      } @else if (insights().length === 0) {
        <div class="text-center py-12 text-gray-400">
          <p class="text-lg mb-1">No insights yet</p>
          <p class="text-sm">Track some habits then generate insights to see patterns!</p>
        </div>
      } @else {
        <div class="grid gap-4">
          @for (insight of insights(); track insight.id) {
            <div class="bg-white rounded-xl shadow-sm border p-5 hover:border-purple-200 transition-colors">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  [class.bg-green-100]="insight.type === 'streak'"
                  [class.bg-blue-100]="insight.type === 'pattern'"
                  [class.bg-purple-100]="insight.type === 'summary'"
                  [class.bg-orange-100]="insight.type === 'recommendation'"
                  [class.text-green-700]="insight.type === 'streak'"
                  [class.text-blue-700]="insight.type === 'pattern'"
                  [class.text-purple-700]="insight.type === 'summary'"
                  [class.text-orange-700]="insight.type === 'recommendation'">
                  {{ insight.type === 'streak' ? '!' : insight.type === 'pattern' ? '~' : insight.type === 'summary' ? '#' : '*' }}
                </div>
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900">{{ insight.title }}</h3>
                  <p class="text-sm text-gray-600 mt-1">{{ insight.content }}</p>
                  <p class="text-xs text-gray-400 mt-2">{{ insight.createdAt | date:'mediumDate' }}</p>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class InsightsComponent implements OnInit {
  insights = signal<Insight[]>([]);
  loading = signal(true);
  generating = signal(false);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadInsights();
  }

  private loadInsights() {
    this.api.getInsights().subscribe({
      next: (insights) => {
        this.insights.set(insights);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  generate() {
    this.generating.set(true);
    this.api.generateInsights().subscribe({
      next: (newInsights) => {
        this.insights.set(newInsights);
        this.generating.set(false);
      },
      error: () => this.generating.set(false),
    });
  }
}
