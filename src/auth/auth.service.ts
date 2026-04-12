import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async register(email: string, password: string, name: string, firstName?: string, lastName?: string) {
    const { data: authData, error: authError } = await this.supabase.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new BadRequestException(authError?.message ?? 'Registration failed');
    }

    const { error: profileError } = await this.supabase.client.from('profiles').insert({
      id: authData.user.id,
      name,
      first_name: firstName ?? '',
      last_name: lastName ?? '',
    });

    if (profileError) {
      await this.supabase.client.auth.admin.deleteUser(authData.user.id);
      throw new InternalServerErrorException(
        `Failed to create user profile: ${profileError.message}`,
      );
    }

    return { message: 'User registered successfully', userId: authData.user.id };
  }

  async login(email: string, password: string) {
    // Use a direct REST call instead of the shared service-role client.
    // Calling signInWithPassword on the service-role client sets a user JWT on
    // the shared client instance, which strips service-role privileges from all
    // subsequent DB calls and causes RLS violations.
    const url = process.env.SUPABASE_URL!;
    const anonKey = process.env.SUPABASE_ANON_KEY!;

    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const body = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      const msg = (body.error_description ?? body.msg ?? body.error ?? 'Invalid email or password') as string;
      throw new UnauthorizedException(msg);
    }

    const session = body as {
      access_token: string;
      refresh_token: string;
      user: { id: string; email: string };
    };

    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: profile?.name ?? '',
      },
    };
  }

  async logout(token?: string) {
    if (token) {
      await this.supabase.client.auth.admin.signOut(token);
    }
    return { message: 'Logged out' };
  }

  async refresh(refreshToken: string) {
    const url = process.env.SUPABASE_URL!;
    const anonKey = process.env.SUPABASE_ANON_KEY!;

    const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await res.json() as {
      access_token: string;
      refresh_token: string;
    };

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    };
  }
}
