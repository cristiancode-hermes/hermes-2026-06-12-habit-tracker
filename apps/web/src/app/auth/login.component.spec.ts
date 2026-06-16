import { TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../shared/auth.service';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('LoginComponent', () => {
  let component: LoginComponent;
  const mockAuthService = {
    login: vi.fn(),
    handleAuthResponse: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('login', () => {
    it('should call auth service and handle response on success', () => {
      const resp = { accessToken: 'token', userId: 'uid', email: 'test@test.com' };
      mockAuthService.login.mockReturnValue(of(resp));

      component.email = 'test@test.com';
      component.password = 'password123';
      component.login();

      expect(mockAuthService.login).toHaveBeenCalledWith('test@test.com', 'password123');
      expect(mockAuthService.handleAuthResponse).toHaveBeenCalledWith(resp);
      // loading stays true because component doesn't set it false on success
      expect(component.loading()).toBe(true);
      expect(component.error()).toBe('');
    });

    it('should set error message on login failure', () => {
      const error = { error: { message: 'Invalid credentials' } };
      mockAuthService.login.mockReturnValue(throwError(() => error));

      component.email = 'test@test.com';
      component.password = 'wrong';
      component.login();

      expect(component.error()).toBe('Invalid credentials');
      expect(component.loading()).toBe(false);
      expect(mockAuthService.handleAuthResponse).not.toHaveBeenCalled();
    });

    it('should set generic error when server message is missing', () => {
      mockAuthService.login.mockReturnValue(throwError(() => new Error('Network error')));

      component.login();

      expect(component.error()).toBe('Login failed');
    });
  });
});
