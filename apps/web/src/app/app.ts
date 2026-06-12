import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './shared/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50">
      @if (auth.isLoggedIn()) {
        <nav class="bg-white shadow-sm border-b">
          <div class="max-w-5xl mx-auto px-4">
            <div class="flex items-center justify-between h-14">
              <div class="flex items-center gap-6">
                <a routerLink="/" class="text-lg font-bold text-primary-600">HabitTracker</a>
                <a routerLink="/" routerLinkActive="text-primary-600 font-medium" [routerLinkActiveOptions]="{exact:true}" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">Dashboard</a>
                <a routerLink="/habits" routerLinkActive="text-primary-600 font-medium" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">Habits</a>
                <a routerLink="/insights" routerLinkActive="text-primary-600 font-medium" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">Insights</a>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500">{{ auth.userEmail() }}</span>
                <button (click)="auth.logout()" class="text-sm text-red-500 hover:text-red-700 transition-colors">Logout</button>
              </div>
            </div>
          </div>
        </nav>
      }
      <main class="max-w-5xl mx-auto px-4 py-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class App {
  constructor(public auth: AuthService) {}
}
