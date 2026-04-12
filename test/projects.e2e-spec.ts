import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './helpers/create-app';
import { createTestUser, deleteTestUser, TestUser } from './helpers/test-user';

describe('Projects (e2e)', () => {
  let app: INestApplication;
  let user: TestUser;
  let workspaceId: string;
  let projectId: string;

  beforeAll(async () => {
    app = await createApp();
    user = await createTestUser('proj');

    // Create a workspace to attach projects to
    const wsRes = await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Projects E2E Workspace' });
    workspaceId = wsRes.body.id as string;
  });

  afterAll(async () => {
    await deleteTestUser(user.userId);
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${user.accessToken}` });

  describe('POST /api/projects', () => {
    it('creates a project under a workspace', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .set(auth())
        .send({ workspaceId, name: 'E2E Project', description: 'Test project' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'E2E Project' });
      projectId = res.body.id as string;
    });
  });

  describe('GET /api/workspaces/:wsId/projects', () => {
    it('lists projects for the workspace', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/workspaces/${workspaceId}/projects`)
        .set(auth());

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((p: { id: string }) => p.id === projectId)).toBe(true);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('returns project by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}`)
        .set(auth());

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: projectId, name: 'E2E Project' });
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('updates the project', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/projects/${projectId}`)
        .set(auth())
        .send({ name: 'E2E Project Updated', description: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ name: 'E2E Project Updated' });
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('deletes the project and returns 204', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/projects/${projectId}`)
        .set(auth());

      expect(res.status).toBe(204);
    });

    it('returns 404 after deletion', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}`)
        .set(auth());

      expect(res.status).toBe(404);
    });
  });
});
