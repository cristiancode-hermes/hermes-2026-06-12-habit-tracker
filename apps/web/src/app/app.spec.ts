import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { AuthService } from './shared/auth.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render navigation when logged in', async () => {
    const fixture = TestBed.createComponent(App);
    const auth = TestBed.inject(AuthService);
    // Simulate logged-in state
    (auth as any).token.set('fake-token');
    (auth as any).userEmailSignal.set('user@test.com');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('HabitTracker');
    expect(compiled.textContent).toContain('Dashboard');
    expect(compiled.textContent).toContain('Logout');
  });
});
