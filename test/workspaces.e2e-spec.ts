import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './helpers/create-app';
import { createTestUser, deleteTestUser, TestUser } from './helpers/test-user';

describe('Workspaces (e2e)', () => {
  let app: INestApplication;
  let user: TestUser;
  let workspaceId: string;

  beforeAll(async () => {
    app = await createApp();
    user = await createTestUser('ws');
  });

  afterAll(async () => {
    await deleteTestUser(user.userId);
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${user.accessToken}` });

  describe('POST /api/workspaces', () => {
    it('creates a workspace and returns 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/workspaces')
        .set(auth())
        .send({ name: 'E2E Workspace' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'E2E Workspace' });
      expect(res.body.id).toBeDefined();
      workspaceId = res.body.id as string;
    });

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/workspaces')
        .send({ name: 'No Auth' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/workspaces', () => {
    it('returns the list including the newly created workspace', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/workspaces')
        .set(auth());

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((w: { id: string }) => w.id === workspaceId)).toBe(true);
    });
  });

  describe('GET /api/workspaces/:id', () => {
    it('returns the workspace by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/workspaces/${workspaceId}`)
        .set(auth());

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: workspaceId, name: 'E2E Workspace' });
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/workspaces/00000000-0000-0000-0000-000000000000')
        .set(auth());

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/workspaces/:id', () => {
    it('updates the workspace name', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/workspaces/${workspaceId}`)
        .set(auth())
        .send({ name: 'E2E Workspace Updated' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ name: 'E2E Workspace Updated' });
    });
  });
});
