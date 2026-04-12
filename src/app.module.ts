import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from './common/auth.guard';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ProjectsModule } from './projects/projects.module';
import { TeamsModule } from './teams/teams.module';
import { TasksModule } from './tasks/tasks.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { MeetingsModule } from './meetings/meetings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { TicketsModule } from './tickets/tickets.module';
import { LinksModule } from './links/links.module';
import { HealthController } from './health/health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    // Load .env file into process.env globally
    ConfigModule.forRoot({ isGlobal: true }),
    // Global rate limiter: 120 requests per 60s per IP (general)
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    SupabaseModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    TeamsModule,
    TasksModule,
    EvaluationsModule,
    MeetingsModule,
    NotificationsModule,
    ChatModule,
    TicketsModule,
    LinksModule,
  ],
  providers: [
    // Rate limiting guard (applies globally)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // JWT auth guard (applies globally, skips @Public() routes)
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
