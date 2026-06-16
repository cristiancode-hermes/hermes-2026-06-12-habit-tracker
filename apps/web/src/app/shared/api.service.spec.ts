import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { vi } from 'vitest';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const mockAuthService = {
    getToken: vi.fn().mockReturnValue('test-token'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const apiUrl = 'http://localhost:3000/api';

  describe('Habits API', () => {
    it('should get all habits', () => {
      const mockHabits = [{ id: '1', name: 'Exercise', frequency: 'daily', targetPerDay: 1, active: true, createdAt: '2026-01-01' }];

      service.getHabits().subscribe((habits) => {
        expect(habits).toEqual(mockHabits);
      });

      const req = httpMock.expectOne(`${apiUrl}/habits`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush(mockHabits);
    });

    it('should get a single habit', () => {
      const mockHabit = { id: '1', name: 'Exercise', frequency: 'daily', targetPerDay: 1, active: true, createdAt: '2026-01-01' };

      service.getHabit('1').subscribe((habit) => {
        expect(habit).toEqual(mockHabit);
      });

      const req = httpMock.expectOne(`${apiUrl}/habits/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHabit);
    });

    it('should create a habit', () => {
      const newHabit = { name: 'Read', frequency: 'daily', targetPerDay: 20 };
      const created = { id: '2', ...newHabit, active: true, createdAt: '2026-01-01' };

      service.createHabit(newHabit).subscribe((habit) => {
        expect(habit).toEqual(created);
      });

      const req = httpMock.expectOne(`${apiUrl}/habits`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newHabit);
      req.flush(created);
    });

    it('should update a habit', () => {
      const update = { name: 'Updated' };
      const updated = { id: '1', name: 'Updated', frequency: 'daily', targetPerDay: 1, active: true, createdAt: '2026-01-01' };

      service.updateHabit('1', update).subscribe((habit) => {
        expect(habit).toEqual(updated);
      });

      const req = httpMock.expectOne(`${apiUrl}/habits/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(update);
      req.flush(updated);
    });

    it('should delete a habit', () => {
      service.deleteHabit('1').subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/habits/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Entries API', () => {
    it('should get entries for a habit', () => {
      const mockEntries = [{ id: 'e1', date: '2026-06-12', count: 1, habitId: '1', createdAt: '2026-01-01' }];

      service.getEntries('1').subscribe((entries) => {
        expect(entries).toEqual(mockEntries);
      });

      const req = httpMock.expectOne(`${apiUrl}/habits/1/entries`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEntries);
    });

    it('should create an entry', () => {
      const entryData = { date: '2026-06-12', count: 1 };
      const created = { id: 'e1', ...entryData, habitId: '1', createdAt: '2026-01-01' };

      service.createEntry('1', entryData).subscribe((entry) => {
        expect(entry).toEqual(created);
      });

      const req = httpMock.expectOne(`${apiUrl}/habits/1/entries`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(entryData);
      req.flush(created);
    });
  });

  describe('Insights API', () => {
    it('should get insights', () => {
      const mockInsights = [{ id: 'i1', type: 'streak', title: 'Test', content: 'Content', data: {}, createdAt: '2026-01-01' }];

      service.getInsights().subscribe((insights) => {
        expect(insights).toEqual(mockInsights);
      });

      const req = httpMock.expectOne(`${apiUrl}/insights`);
      expect(req.request.method).toBe('GET');
      req.flush(mockInsights);
    });

    it('should generate insights', () => {
      const mockInsights = [{ id: 'i1', type: 'streak', title: 'New Insight', content: 'Content', data: {}, createdAt: '2026-01-01' }];

      service.generateInsights().subscribe((insights) => {
        expect(insights).toEqual(mockInsights);
      });

      const req = httpMock.expectOne(`${apiUrl}/insights/generate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockInsights);
    });
  });
});
