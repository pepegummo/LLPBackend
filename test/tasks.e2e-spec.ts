import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './helpers/create-app';
import { createTestUser, deleteTestUser, TestUser } from './helpers/test-user';

describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let user: TestUser;
  let teamId: string;
  let taskId: string;
  let subtaskId: string;

  beforeAll(async () => {
    app = await createApp();
    user = await createTestUser('tasks');

    // Build the entity chain: workspace → project → team
    const wsRes = await request(app.getHttpServer())
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ name: 'Tasks E2E Workspace' });
    const workspaceId = wsRes.body.id as string;

    const projRes = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ workspaceId, name: 'Tasks E2E Project' });
    const projectId = projRes.body.id as string;

    const teamRes = await request(app.getHttpServer())
      .post('/api/teams')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ projectId, workspaceId, name: 'Tasks E2E Team' });
    teamId = teamRes.body.id as string;
  });

  afterAll(async () => {
    await deleteTestUser(user.userId);
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${user.accessToken}` });

  describe('POST /api/tasks', () => {
    it('creates a task in the team', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .set(auth())
        .send({ teamId, title: 'E2E Task', description: 'A test task', status: 'todo' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: 'E2E Task', status: 'todo' });
      taskId = res.body.id as string;
    });

    it('returns 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tasks')
        .send({ teamId, title: 'No Auth Task' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/teams/:teamId/tasks', () => {
    it('lists tasks for the team', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/teams/${teamId}/tasks`)
        .set(auth());

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((t: { id: string }) => t.id === taskId)).toBe(true);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('returns the task by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/tasks/${taskId}`)
        .set(auth());

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: taskId, title: 'E2E Task' });
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('updates task status to in_progress', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}`)
        .set(auth())
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'in_progress' });
    });
  });

  describe('POST /api/tasks/:id/subtasks', () => {
    it('adds a subtask', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/tasks/${taskId}/subtasks`)
        .set(auth())
        .send({ title: 'Subtask 1', manHours: 2 });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: 'Subtask 1' });
      subtaskId = res.body.id as string;
    });
  });

  describe('PATCH /api/tasks/:id/subtasks/:subtaskId', () => {
    it('marks subtask as completed', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}/subtasks/${subtaskId}`)
        .set(auth())
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ completed: true });
    });
  });

  describe('DELETE /api/tasks/:id/subtasks/:subtaskId', () => {
    it('deletes the subtask', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/tasks/${taskId}/subtasks/${subtaskId}`)
        .set(auth());

      expect(res.status).toBe(204);
    });
  });

  describe('POST /api/tasks/:id/attachments', () => {
    it('adds an attachment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/tasks/${taskId}/attachments`)
        .set(auth())
        .send({ label: 'Design Doc', url: 'https://example.com/doc.pdf' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ label: 'Design Doc' });
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('deletes the task', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/tasks/${taskId}`)
        .set(auth());

      expect(res.status).toBe(204);
    });
  });
});
