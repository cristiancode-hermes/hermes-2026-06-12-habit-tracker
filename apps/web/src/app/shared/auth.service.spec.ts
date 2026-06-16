import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

describe('AuthService (web)', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should be logged out when no token in localStorage', () => {
      expect(service.isLoggedIn()).toBe(false);
      expect(service.getToken()).toBeNull();
      expect(service.userEmail()).toBe('');
      expect(service.userId()).toBe('');
    });

    it('should be logged in when token exists in localStorage', () => {
      localStorage.setItem('auth_token', 'existing-token');
      localStorage.setItem('user_email', 'user@test.com');
      localStorage.setItem('user_id', 'user-uuid');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          provideRouter([]),
        ],
      });

      const loggedInService = TestBed.inject(AuthService);

      expect(loggedInService.isLoggedIn()).toBe(true);
      expect(loggedInService.getToken()).toBe('existing-token');
      expect(loggedInService.userEmail()).toBe('user@test.com');
      expect(loggedInService.userId()).toBe('user-uuid');
    });
  });

  describe('handleAuthResponse', () => {
    it('should store auth data and navigate to home', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate');
      const resp = { accessToken: 'new-token', email: 'test@test.com', userId: 'uid-123' };

      service.handleAuthResponse(resp);

      expect(localStorage.getItem('auth_token')).toBe('new-token');
      expect(localStorage.getItem('user_email')).toBe('test@test.com');
      expect(localStorage.getItem('user_id')).toBe('uid-123');
      expect(service.isLoggedIn()).toBe(true);
      expect(service.getToken()).toBe('new-token');
      expect(service.userEmail()).toBe('test@test.com');
      expect(service.userId()).toBe('uid-123');
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });
  });

  describe('logout', () => {
    it('should clear auth data and navigate to login', () => {
      localStorage.setItem('auth_token', 'token');
      localStorage.setItem('user_email', 'user@test.com');
      localStorage.setItem('user_id', 'uid');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          provideRouter([]),
        ],
      });

      const loggedInService = TestBed.inject(AuthService);
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate');

      loggedInService.logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user_email')).toBeNull();
      expect(localStorage.getItem('user_id')).toBeNull();
      expect(loggedInService.isLoggedIn()).toBe(false);
      expect(loggedInService.getToken()).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('login and register HTTP calls', () => {
    it('should have login and register methods', () => {
      expect(typeof service.login).toBe('function');
      expect(typeof service.register).toBe('function');
    });
  });
});
