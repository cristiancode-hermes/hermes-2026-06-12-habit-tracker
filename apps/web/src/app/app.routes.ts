import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './shared/auth.service';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register.component').then(m => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [() => {
      const auth = inject(AuthService);
      const router = inject(Router);
      if (!auth.isLoggedIn()) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    }],
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'habits',
        loadComponent: () => import('./habits/habits-list.component').then(m => m.HabitsListComponent),
      },
      {
        path: 'habits/:id',
        loadComponent: () => import('./habits/habit-detail.component').then(m => m.HabitDetailComponent),
      },
      {
        path: 'insights',
        loadComponent: () => import('./insights/insights.component').then(m => m.InsightsComponent),
      },
    ],
  },
];
