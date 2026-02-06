import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

enum roleTypes {
  admin = 'admin',
  user = 'user',
}

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  name?: string;

  @IsString()
  @IsNotEmpty()
  role!: roleTypes;

  @IsString()
  bio?: string;

  @IsString()
  @IsNotEmpty()
  username!: string;
}
