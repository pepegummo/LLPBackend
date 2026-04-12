import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './helpers/create-app';
import { createTestUser, deleteTestUser, TestUser } from './helpers/test-user';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let user: TestUser;

  beforeAll(async () => {
    app = await createApp();
    user = await createTestUser('auth');
  });

  afterAll(async () => {
    await deleteTestUser(user.userId);
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('returns 201 with tokens on valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: { email: user.email },
      });
    });

    it('returns 401 on wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 401 on unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@llp-test.local', password: 'Test1234!' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/register', () => {
    const newEmail = `e2e_reg_${Date.now()}@llp-test.local`;
    let newUserId: string | undefined;

    afterAll(async () => {
      if (newUserId) await deleteTestUser(newUserId);
    });

    it('creates a new user and returns userId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: newEmail, password: 'Test1234!', name: 'New E2E User' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        message: expect.any(String),
        userId: expect.any(String),
      });
      newUserId = res.body.userId as string;
    });

    it('returns 400 when email already exists', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: newEmail, password: 'Test1234!', name: 'Duplicate' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('returns new tokens on valid refresh token', async () => {
      // First login to get a refresh token
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });

      const { refreshToken } = loginRes.body as { refreshToken: string };

      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('returns 401 on invalid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 201 when called with a valid token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ message: expect.any(String) });
    });
  });
});
