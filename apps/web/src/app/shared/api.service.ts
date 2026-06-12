import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  targetPerDay: number;
  active: boolean;
  createdAt: string;
}

export interface HabitEntry {
  id: string;
  date: string;
  count: number;
  note?: string;
  habitId: string;
  createdAt: string;
}

export interface Insight {
  id: string;
  type: string;
  title: string;
  content: string;
  data: any;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getToken()}`,
      'Content-Type': 'application/json',
    });
  }

  // Habits
  getHabits() {
    return this.http.get<Habit[]>(`${this.apiUrl}/habits`, { headers: this.headers() });
  }

  getHabit(id: string) {
    return this.http.get<Habit>(`${this.apiUrl}/habits/${id}`, { headers: this.headers() });
  }

  createHabit(data: Partial<Habit>) {
    return this.http.post<Habit>(`${this.apiUrl}/habits`, data, { headers: this.headers() });
  }

  updateHabit(id: string, data: Partial<Habit>) {
    return this.http.put<Habit>(`${this.apiUrl}/habits/${id}`, data, { headers: this.headers() });
  }

  deleteHabit(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/habits/${id}`, { headers: this.headers() });
  }

  // Entries
  getEntries(habitId: string) {
    return this.http.get<HabitEntry[]>(`${this.apiUrl}/habits/${habitId}/entries`, { headers: this.headers() });
  }

  createEntry(habitId: string, data: { date: string; count?: number; note?: string }) {
    return this.http.post<HabitEntry>(`${this.apiUrl}/habits/${habitId}/entries`, data, { headers: this.headers() });
  }

  // Insights
  getInsights() {
    return this.http.get<Insight[]>(`${this.apiUrl}/insights`, { headers: this.headers() });
  }

  generateInsights() {
    return this.http.post<Insight[]>(`${this.apiUrl}/insights/generate`, {}, { headers: this.headers() });
  }
}
