import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '../shared/api.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  const mockApiService = {
    getHabits: vi.fn(),
    getInsights: vi.fn(),
    getEntries: vi.fn(),
    createEntry: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load habits and insights on init', () => {
    const habits = [
      { id: '1', name: 'Exercise', frequency: 'daily', targetPerDay: 1, active: true, createdAt: '2026-01-01' },
    ];
    const insights = [{ id: 'i1', type: 'streak', title: 'Test', content: 'Content', data: {}, createdAt: '2026-01-01' }];

    mockApiService.getHabits.mockReturnValue(of(habits));
    mockApiService.getInsights.mockReturnValue(of(insights));
    mockApiService.getEntries.mockReturnValue(of([]));

    component.ngOnInit();

    expect(component.habits()).toEqual(habits);
    expect(component.insights()).toEqual(insights);
    expect(component.loading()).toBe(false);
  });

  it('should handle error when loading habits', () => {
    mockApiService.getHabits.mockReturnValue(of([]));
    mockApiService.getInsights.mockReturnValue(of([]));
    mockApiService.getEntries.mockImplementation(() => { throw new Error('fail'); });

    expect(() => component.ngOnInit()).not.toThrow();
  });

  it('should compute active streaks', () => {
    component.streaks.set({ '1': 3, '2': 0, '3': 5 });

    expect(component.activeStreaks()).toBe(2);
  });

  it('should return streak count for a habit', () => {
    component.streaks.set({ '1': 3, '2': 0 });

    expect(component.getStreak('1')).toBe(3);
    expect(component.getStreak('2')).toBe(0);
    expect(component.getStreak('nonexistent')).toBe(0);
  });

  it('should quick log and reload entries', () => {
    const newEntry = { id: 'e1', date: '2026-06-16', count: 1, habitId: '1', createdAt: '2026-06-16' };
    mockApiService.createEntry.mockReturnValue(of(newEntry));
    mockApiService.getEntries.mockReturnValue(of([newEntry]));

    component.selectedHabitId.set('1');
    component.quickLog();

    expect(mockApiService.createEntry).toHaveBeenCalledWith('1', { date: expect.any(String), count: 1 });
    expect(component.selectedHabitId()).toBe('');
  });

  it('should not quick log when no habit selected', () => {
    component.selectedHabitId.set('');
    component.quickLog();

    expect(mockApiService.createEntry).not.toHaveBeenCalled();
  });
});
