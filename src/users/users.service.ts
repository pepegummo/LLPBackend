import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async getMe(userId: string) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*, contacts(*)')
      .eq('id', userId)
      .single();

    if (error) throw new NotFoundException('Profile not found');
    return data;
  }

  async updateMe(
    userId: string,
    body: { name?: string; firstName?: string; lastName?: string; bio?: string },
  ) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .update({
        name: body.name,
        first_name: body.firstName,
        last_name: body.lastName,
        bio: body.bio,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async updateContacts(userId: string, contacts: { type: string; value: string }[]) {
    await this.supabase.client.from('contacts').delete().eq('user_id', userId);

    if (contacts?.length) {
      const { error } = await this.supabase.client
        .from('contacts')
        .insert(contacts.map((c) => ({ user_id: userId, type: c.type, value: c.value })));

      if (error) throw new InternalServerErrorException(error.message);
    }

    return { message: 'Contacts updated' };
  }

  async getUserById(id: string) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, name, first_name, last_name, bio, contacts(*)')
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('User not found');
    return data;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const { data: authData } = await this.supabase.client.auth.admin.getUserById(userId);
    if (!authData?.user?.email) throw new NotFoundException('User not found');

    const url = process.env.SUPABASE_URL!;
    const anonKey = process.env.SUPABASE_ANON_KEY!;

    // Verify current password
    const verifyRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey },
      body: JSON.stringify({ email: authData.user.email, password: currentPassword }),
    });
    if (!verifyRes.ok) throw new UnauthorizedException('รหัสผ่านปัจจุบันไม่ถูกต้อง');

    const { error } = await this.supabase.client.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Password changed' };
  }

  async searchByEmail(email: string) {
    // Look up the auth user by email via admin API, then return their profile
    const { data: authData, error: authError } = await this.supabase.client.auth.admin.listUsers();
    if (authError) throw new InternalServerErrorException(authError.message);

    const authUser = (authData?.users ?? []).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!authUser) throw new NotFoundException('No user found with that email');

    const { data: profile, error: profileError } = await this.supabase.client
      .from('profiles')
      .select('id, name, first_name, last_name')
      .eq('id', authUser.id)
      .single();

    if (profileError) throw new NotFoundException('User profile not found');
    return { ...profile, email: authUser.email };
  }
}
