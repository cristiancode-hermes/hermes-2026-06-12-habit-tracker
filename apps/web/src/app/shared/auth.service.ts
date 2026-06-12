import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

export interface AuthResponse {
  accessToken: string;
  userId: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private token = signal<string | null>(localStorage.getItem('auth_token'));
  private userEmailSignal = signal<string>(localStorage.getItem('user_email') || '');
  private userIdSignal = signal<string>(localStorage.getItem('user_id') || '');

  isLoggedIn = computed(() => this.token() !== null);
  userEmail = this.userEmailSignal.asReadonly();
  userId = this.userIdSignal.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password });
  }

  register(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, { email, password });
  }

  handleAuthResponse(resp: AuthResponse) {
    localStorage.setItem('auth_token', resp.accessToken);
    localStorage.setItem('user_email', resp.email);
    localStorage.setItem('user_id', resp.userId);
    this.token.set(resp.accessToken);
    this.userEmailSignal.set(resp.email);
    this.userIdSignal.set(resp.userId);
    this.router.navigate(['/']);
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    this.token.set(null);
    this.userEmailSignal.set('');
    this.userIdSignal.set('');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token();
  }
}
