import { TestBed } from '@angular/core/testing';
import { HabitsListComponent } from './habits-list.component';
import { ApiService } from '../shared/api.service';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('HabitsListComponent', () => {
  let component: HabitsListComponent;
  const mockApiService = {
    getHabits: vi.fn(),
    createHabit: vi.fn(),
    updateHabit: vi.fn(),
    deleteHabit: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HabitsListComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: mockApiService },
      ],
    });

    const fixture = TestBed.createComponent(HabitsListComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load habits on init', () => {
      const habits = [
        { id: '1', name: 'Exercise', frequency: 'daily', targetPerDay: 1, active: true, createdAt: '2026-01-01' },
      ];
      mockApiService.getHabits.mockReturnValue(of(habits));

      component.ngOnInit();

      expect(component.habits()).toEqual(habits);
      expect(component.loading()).toBe(false);
    });

    it('should handle error when loading habits', () => {
      mockApiService.getHabits.mockReturnValue(throwError(() => new Error('fail')));

      component.ngOnInit();

      expect(component.habits()).toEqual([]);
      expect(component.loading()).toBe(false);
    });
  });

  describe('createHabit', () => {
    it('should create a habit and prepend to list', () => {
      const newHabit = { id: '2', name: 'Read', description: 'Read books', frequency: 'daily' as const, targetPerDay: 1, active: true, createdAt: '2026-06-16' };
      component.newName = 'Read';
      component.newDescription = 'Read books';
      component.newFrequency = 'daily';
      component.newTarget = 1;
      mockApiService.createHabit.mockReturnValue(of(newHabit));

      component.createHabit();

      expect(mockApiService.createHabit).toHaveBeenCalledWith({
        name: 'Read',
        description: 'Read books',
        frequency: 'daily',
        targetPerDay: 1,
      });
      expect(component.habits()[0].name).toBe('Read');
      expect(component.showForm()).toBe(false);
      expect(component.newName).toBe('');
    });

    it('should not create habit with empty name', () => {
      component.newName = '   ';
      component.createHabit();

      expect(mockApiService.createHabit).not.toHaveBeenCalled();
    });

    it('should set form error on failure', () => {
      component.newName = 'Test';
      mockApiService.createHabit.mockReturnValue(throwError(() => ({ error: { message: 'Failed' } })));

      component.createHabit();

      expect(component.formError()).toBe('Failed');
    });
  });

  describe('toggleActive', () => {
    it('should toggle habit active state', () => {
      const habit = { id: '1', name: 'Exercise', frequency: 'daily', targetPerDay: 1, active: true, createdAt: '2026-01-01' };
      component.habits.set([habit]);
      mockApiService.updateHabit.mockReturnValue(of({}));

      component.toggleActive(habit);

      expect(component.habits()[0].active).toBe(false);
      expect(mockApiService.updateHabit).toHaveBeenCalledWith('1', { active: false });
    });
  });

  describe('deleteHabit', () => {
    it('should delete habit when confirmed', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const habit = { id: '1', name: 'Exercise', frequency: 'daily', targetPerDay: 1, active: true, createdAt: '2026-01-01' };
      component.habits.set([habit]);
      mockApiService.deleteHabit.mockReturnValue(of({}));

      component.deleteHabit(habit);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockApiService.deleteHabit).toHaveBeenCalledWith('1');
      expect(component.habits()).toEqual([]);
    });

    it('should not delete habit when cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const habit = { id: '1', name: 'Exercise', frequency: 'daily', targetPerDay: 1, active: true, createdAt: '2026-01-01' };
      component.habits.set([habit]);

      component.deleteHabit(habit);

      expect(mockApiService.deleteHabit).not.toHaveBeenCalled();
      expect(component.habits()).toHaveLength(1);
    });
  });
});
