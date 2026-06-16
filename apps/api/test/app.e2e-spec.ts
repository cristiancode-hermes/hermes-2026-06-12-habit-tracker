import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { HabitsModule } from '../src/habits/habits.module';
import { EntriesModule } from '../src/entries/entries.module';
import { InsightsModule } from '../src/insights/insights.module';
import { User } from '../src/auth/user.entity';
import { Habit } from '../src/habits/habit.entity';
import { HabitEntry } from '../src/entries/habit-entry.entity';
import { Insight } from '../src/insights/insight.entity';

describe('Habit Tracker API (e2e)', () => {
  let app: INestApplication;
  let authToken1: string;
  let authToken2: string;
  let userId1: string;
  let userId2: string;

  // Store created resource IDs
  let habitId: string;
  let habitId2: string;
  let entryId: string;
  let entryId2: string;
  let insightIds: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ ignoreEnvFile: true, isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [User, Habit, HabitEntry, Insight],
          synchronize: true,
        }),
        AuthModule,
        HabitsModule,
        EntriesModule,
        InsightsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Match main.ts setup
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Auth ────────────────────────────────────────────────────────

  describe('Authentication (register / login)', () => {
    const user1 = { email: 'alice@test.com', password: 'secret123' };
    const user2 = { email: 'bob@test.com', password: 'bobpass456' };

    it('POST /api/auth/register — should register user 1', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(user1)
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('userId');
      expect(res.body.email).toBe(user1.email);
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.accessToken.length).toBeGreaterThan(0);

      authToken1 = res.body.accessToken;
      userId1 = res.body.userId;
    });

    it('POST /api/auth/register — should register user 2', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(user2)
        .expect(201);

      expect(res.body.email).toBe(user2.email);
      authToken2 = res.body.accessToken;
      userId2 = res.body.userId;
    });

    it('POST /api/auth/register — should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(user1)
        .expect(409);
    });

    it('POST /api/auth/register — should reject invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400);
    });

    it('POST /api/auth/register — should reject short password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'short@test.com', password: '12345' })
        .expect(400);
    });

    it('POST /api/auth/login — should login with correct credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(user1)
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('userId');
      expect(res.body.email).toBe(user1.email);
      // Update token in case it changed
      authToken1 = res.body.accessToken;
    });

    it('POST /api/auth/login — should reject wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user1.email, password: 'wrongpass' })
        .expect(401);
    });

    it('POST /api/auth/login — should reject non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: 'somepass' })
        .expect(401);
    });
  });

  // ─── Habits CRUD ────────────────────────────────────────────────

  describe('Habits CRUD', () => {
    it('GET /api/habits — should return empty list for new user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('POST /api/habits — should create a habit', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          name: 'Morning Meditation',
          description: '10 minutes of mindfulness',
          frequency: 'daily',
          targetPerDay: 1,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Morning Meditation');
      expect(res.body.description).toBe('10 minutes of mindfulness');
      expect(res.body.frequency).toBe('daily');
      expect(res.body.targetPerDay).toBe(1);
      expect(res.body.active).toBe(true);
      expect(res.body.userId).toBe(userId1);

      habitId = res.body.id;
    });

    it('POST /api/habits — should create a second habit for user 1', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          name: 'Evening Reading',
          frequency: 'weekly',
        })
        .expect(201);

      habitId2 = res.body.id;
    });

    it('POST /api/habits — should reject missing name', async () => {
      await request(app.getHttpServer())
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ frequency: 'daily' })
        .expect(400);
    });

    it('POST /api/habits — should reject name > 200 chars', async () => {
      await request(app.getHttpServer())
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ name: 'x'.repeat(201) })
        .expect(400);
    });

    it('POST /api/habits — should reject invalid frequency', async () => {
      await request(app.getHttpServer())
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ name: 'Bad Habit', frequency: 'yearly' })
        .expect(400);
    });

    it('POST /api/habits — should reject non-whitelisted field', async () => {
      await request(app.getHttpServer())
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ name: 'Test', injectedField: 'should be stripped or rejected' })
        .expect(400);
    });

    it('GET /api/habits — should return user 1 habits sorted by creation date desc', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      // Both habit IDs should be present (order may vary with same-second creation)
      const ids = res.body.map((h: any) => h.id);
      expect(ids).toContain(habitId);
      expect(ids).toContain(habitId2);
      // Confirm descending order by createdAt
      expect(new Date(res.body[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(res.body[1].createdAt).getTime(),
      );
    });

    it('GET /api/habits — should not return other user habits', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('GET /api/habits/:id — should get a single habit', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(res.body.id).toBe(habitId);
      expect(res.body.name).toBe('Morning Meditation');
    });

    it('GET /api/habits/:id — should 404 for non-existent habit', async () => {
      await request(app.getHttpServer())
        .get('/api/habits/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);
    });

    it('GET /api/habits/:id — should 404 for other user habit', async () => {
      await request(app.getHttpServer())
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(404);
    });

    it('PUT /api/habits/:id — should update a habit', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ name: 'Morning Yoga', frequency: 'weekdays', targetPerDay: 2 })
        .expect(200);

      expect(res.body.name).toBe('Morning Yoga');
      expect(res.body.frequency).toBe('weekdays');
      expect(res.body.targetPerDay).toBe(2);
    });

    it('PUT /api/habits/:id — should 404 for other user', async () => {
      await request(app.getHttpServer())
        .put(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ name: 'Hacked' })
        .expect(404);
    });

    it('PUT /api/habits/:id — should reject invalid update fields', async () => {
      await request(app.getHttpServer())
        .put(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ name: 'x'.repeat(201) })
        .expect(400);
    });

    it('DELETE /api/habits/:id — should 404 for other user', async () => {
      await request(app.getHttpServer())
        .delete(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(404);
    });

    it('DELETE /api/habits/:id — should delete the second habit', async () => {
      await request(app.getHttpServer())
        .delete(`/api/habits/${habitId2}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);
    });

    it('GET /api/habits — should confirm deletion', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(habitId);
    });
  });

  // ─── Entries CRUD ───────────────────────────────────────────────

  describe('Entries CRUD', () => {
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    it('GET /api/habits/:habitId/entries — should return empty list initially', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/habits/${habitId}/entries`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('POST /api/habits/:habitId/entries — should create an entry', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/habits/${habitId}/entries`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ date: today, count: 1, note: 'Felt great!' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.date).toBe(today);
      expect(res.body.count).toBe(1);
      expect(res.body.note).toBe('Felt great!');
      expect(res.body.habitId).toBe(habitId);

      entryId = res.body.id;
    });

    it('POST /api/habits/:habitId/entries — should merge (increment) entry for same date', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/habits/${habitId}/entries`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ date: today, count: 2, note: 'Did another session' })
        .expect(201);

      // The service finds the existing entry and adds count
      expect(res.body.count).toBe(3); // 1 + 2
      expect(res.body.note).toBe('Did another session');
      expect(res.body.id).toBe(entryId); // same entry

      entryId = res.body.id;
    });

    it('POST /api/habits/:habitId/entries — should create entry for different date', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/habits/${habitId}/entries`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ date: yesterday, count: 1 })
        .expect(201);

      expect(res.body.date).toBe(yesterday);
      expect(res.body.count).toBe(1);
      expect(res.body.id).not.toBe(entryId);

      entryId2 = res.body.id;
    });

    it('POST /api/habits/:habitId/entries — should reject missing date', async () => {
      await request(app.getHttpServer())
        .post(`/api/habits/${habitId}/entries`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ count: 1 })
        .expect(400);
    });

    it('POST /api/habits/:habitId/entries — should reject invalid date format', async () => {
      await request(app.getHttpServer())
        .post(`/api/habits/${habitId}/entries`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ date: 'not-a-date', count: 1 })
        .expect(400);
    });

    it('POST /api/habits/:habitId/entries — should reject count < 1', async () => {
      await request(app.getHttpServer())
        .post(`/api/habits/${habitId}/entries`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ date: today, count: 0 })
        .expect(400);
    });

    it('POST /api/habits/:habitId/entries — should 500 for non-existent habit (FK constraint)', async () => {
      await request(app.getHttpServer())
        .post('/api/habits/00000000-0000-0000-0000-000000000000/entries')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ date: today, count: 1 })
        .expect(500);
    });

    it('GET /api/habits/:habitId/entries — should list entries sorted by date desc', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/habits/${habitId}/entries`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      // Most recent date first
      expect(res.body[0].date).toBe(today);
      expect(res.body[1].date).toBe(yesterday);
    });

    it('GET /api/habits/:habitId/entries — should filter by date range', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/habits/${habitId}/entries`)
        .query({ startDate: today, endDate: today })
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].date).toBe(today);
    });

    it('PUT /api/entries/:id — should update entry note and count', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/entries/${entryId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ count: 5, note: 'Updated note' })
        .expect(200);

      expect(res.body.count).toBe(5);
      expect(res.body.note).toBe('Updated note');
    });

    it('PUT /api/entries/:id — should 404 for non-existent entry', async () => {
      await request(app.getHttpServer())
        .put('/api/entries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ count: 1 })
        .expect(404);
    });

    it('DELETE /api/entries/:id — should delete an entry', async () => {
      await request(app.getHttpServer())
        .delete(`/api/entries/${entryId2}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);
    });

    it('GET /api/habits/:habitId/entries — should confirm deletion', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/habits/${habitId}/entries`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(entryId);
    });

    it('DELETE /api/entries/:id — should 404 for already deleted entry', async () => {
      await request(app.getHttpServer())
        .delete(`/api/entries/${entryId2}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);
    });
  });

  // ─── Insights ───────────────────────────────────────────────────

  describe('Insights', () => {
    it('GET /api/insights — should return empty list initially', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/insights')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('POST /api/insights/generate — should generate insights from habit data', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/insights/generate')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
      // With 1 habit and 1 entry, we should get:
      //   - streak insight (1-day streak)
      //   - pattern insight (if entries >= 3, but we have 1, so pattern may not trigger)
      //   - summary insight
      // Actually pattern needs >= 3 entries, so we'll get streak + summary = at least 2
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      // Store insight IDs
      insightIds = res.body.map((i: any) => i.id);

      // Check insight structure
      const streakInsight = res.body.find((i: any) => i.type === 'streak');
      expect(streakInsight).toBeDefined();
      expect(streakInsight.title).toContain('Morning Yoga');
      expect(streakInsight.userId).toBe(userId1);

      const summaryInsight = res.body.find((i: any) => i.type === 'summary');
      expect(summaryInsight).toBeDefined();
      expect(summaryInsight.title).toBe('Weekly Performance Summary');
    });

    it('POST /api/insights/generate — should generate again with results', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/insights/generate')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(201);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/insights — should return generated insights', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/insights')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1); // At least some insights persisted
      // Most recent first
      expect(new Date(res.body[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(res.body[res.body.length - 1].createdAt).getTime(),
      );
    });

    it('GET /api/insights — other user should have nothing', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/insights')
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('POST /api/insights/generate — other user generates from their (empty) habits', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/insights/generate')
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(201);

      // User2 has no habits, so only summary insight with 0 habits and 0 streaks
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Authorization guard (JWT) ──────────────────────────────────

  describe('Authorization', () => {
    it('should reject requests without token', async () => {
      await request(app.getHttpServer())
        .get('/api/habits')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/habits')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject requests with expired / malformed token', async () => {
      await request(app.getHttpServer())
        .get('/api/habits')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U')
        .expect(401);
    });

    it('should allow authenticated access to all protected endpoints', async () => {
      // Guarantee we have a valid token
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'alice@test.com', password: 'secret123' })
        .expect(201);

      const token = loginRes.body.accessToken;

      await request(app.getHttpServer())
        .get('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/habits/${habitId}/entries`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/insights')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
