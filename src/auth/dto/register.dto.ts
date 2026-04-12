import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  // At least 8 chars, one uppercase, one lowercase, one digit
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(72, { message: 'password must not exceed 72 characters' })
  @Matches(/(?=.*[a-z])/, { message: 'password must contain at least one lowercase letter' })
  @Matches(/(?=.*[A-Z])/, { message: 'password must contain at least one uppercase letter' })
  @Matches(/(?=.*\d)/, { message: 'password must contain at least one number' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;
}
