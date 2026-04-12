import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getByWorkspace(wsId: string) {
    const { data, error } = await this.supabase.client
      .from('projects')
      .select('*')
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async create(workspaceId: string, name: string, description?: string) {
    if (!workspaceId || !name) {
      throw new BadRequestException('workspaceId and name are required');
    }

    const { data, error } = await this.supabase.client
      .from('projects')
      .insert({ workspace_id: workspaceId, name, description })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async getById(id: string) {
    const { data, error } = await this.supabase.client
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('Project not found');
    return data;
  }

  async update(id: string, name?: string, description?: string) {
    const { data, error } = await this.supabase.client
      .from('projects')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase.client.from('projects').delete().eq('id', id);
    if (error) throw new InternalServerErrorException(error.message);
  }
}
