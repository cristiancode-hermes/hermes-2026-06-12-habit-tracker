import { TestBed } from '@angular/core/testing';
import { HabitDetailComponent } from './habit-detail.component';
import { ApiService } from '../shared/api.service';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('HabitDetailComponent', () => {
  let component: HabitDetailComponent;
  const mockApiService = {
    getHabit: vi.fn(),
    getEntries: vi.fn(),
    createEntry: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HabitDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: mockApiService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'id' ? 'habit-1' : null,
              },
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(HabitDetailComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load habit and entries on init', () => {
      const habit = { id: 'habit-1', name: 'Exercise', frequency: 'daily', targetPerDay: 1, active: true, createdAt: '2026-01-01' };
      const entries = [{ id: 'e1', date: '2026-06-16', count: 1, habitId: 'habit-1', createdAt: '2026-06-16' }];

      mockApiService.getHabit.mockReturnValue(of(habit));
      mockApiService.getEntries.mockReturnValue(of(entries));

      component.ngOnInit();

      expect(component.habit()).toEqual(habit);
      expect(component.entries()).toEqual(entries);
      expect(component.loading()).toBe(false);
    });

    it('should handle error when loading habit', () => {
      mockApiService.getHabit.mockReturnValue(of(null));
      mockApiService.getEntries.mockReturnValue(of([]));

      component.ngOnInit();

      expect(component.loading()).toBe(false);
    });
  });

  describe('computations', () => {
    it('should compute streak from entries', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      component.entries.set([
        { id: 'e1', date: today, count: 1, habitId: 'habit-1', createdAt: '2026-06-16' },
        { id: 'e2', date: yesterday, count: 1, habitId: 'habit-1', createdAt: '2026-06-15' },
      ]);

      expect(component.streak()).toBe(2);
    });

    it('should return 0 streak when no entries', () => {
      component.entries.set([]);
      expect(component.streak()).toBe(0);
    });

    it('should compute total entries count', () => {
      component.entries.set([
        { id: 'e1', date: '2026-06-16', count: 1, habitId: 'habit-1', createdAt: '2026-06-16' },
        { id: 'e2', date: '2026-06-15', count: 2, habitId: 'habit-1', createdAt: '2026-06-15' },
      ]);
      expect(component.totalEntries()).toBe(2);
    });
  });

  describe('logEntry', () => {
    it('should create entry and prepend to list', () => {
      const habit = { id: 'habit-1', name: 'Exercise', frequency: 'daily', targetPerDay: 1, active: true, createdAt: '2026-01-01' };
      const newEntry = { id: 'e3', date: '2026-06-16', count: 1, habitId: 'habit-1', createdAt: '2026-06-16' };

      component.habit.set(habit);
      component.logDate = '2026-06-16';
      component.logCount = 1;
      mockApiService.createEntry.mockReturnValue(of(newEntry));

      component.logEntry();

      expect(mockApiService.createEntry).toHaveBeenCalledWith('habit-1', { date: '2026-06-16', count: 1 });
      expect(component.entries()[0].id).toBe('e3');
    });

    it('should not create entry when habit is null', () => {
      component.habit.set(null);
      component.logEntry();

      expect(mockApiService.createEntry).not.toHaveBeenCalled();
    });
  });
});
