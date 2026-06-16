import { TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../shared/auth.service';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  const mockAuthService = {
    register: vi.fn(),
    handleAuthResponse: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    const fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('register', () => {
    it('should call auth service and handle response on success', () => {
      const resp = { accessToken: 'token', userId: 'uid', email: 'newuser@test.com' };
      mockAuthService.register.mockReturnValue(of(resp));

      component.email = 'newuser@test.com';
      component.password = 'password123';
      component.register();

      expect(mockAuthService.register).toHaveBeenCalledWith('newuser@test.com', 'password123');
      expect(mockAuthService.handleAuthResponse).toHaveBeenCalledWith(resp);
      // loading stays true because component doesn't set it false on success
      expect(component.loading()).toBe(true);
      expect(component.error()).toBe('');
    });

    it('should set error message on registration failure', () => {
      const error = { error: { message: 'Email already registered' } };
      mockAuthService.register.mockReturnValue(throwError(() => error));

      component.email = 'existing@test.com';
      component.password = 'password123';
      component.register();

      expect(component.error()).toBe('Email already registered');
      expect(component.loading()).toBe(false);
      expect(mockAuthService.handleAuthResponse).not.toHaveBeenCalled();
    });

    it('should set generic error when server message is missing', () => {
      mockAuthService.register.mockReturnValue(throwError(() => new Error('Network error')));

      component.register();

      expect(component.error()).toBe('Registration failed');
    });
  });
});
