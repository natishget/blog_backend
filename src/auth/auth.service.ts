import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, userRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private handlePrismaError(e: unknown) {
    if (e && typeof e === 'object' && 'code' in (e as any)) {
      const err = e as Prisma.PrismaClientKnownRequestError;
      if (err.code === 'P2002')
        throw new ConflictException('Email already registered');
      throw new BadRequestException(err.message);
    }
    throw e;
  }

  private sanitizeUser(user: {
    id: number;
    email: string;
    name: string | null;
    role: userRole;
  }) {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async registerUser(dto: CreateUserDto) {
    try {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email, username: dto.username },
      });
      if (existing)
        throw new ConflictException('Email or Username already registered');

      const hash = await bcrypt.hash(dto.password, 10);
      const created = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          bio: dto.bio ?? '',
          name: dto.name ?? null,
          password: hash,
          role: dto.role ?? 'user',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          username: true,
          bio: true,
          createdAt: true,
        },
      });

      return this.sanitizeUser(created);
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async loginUser(dto: LoginUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (!user) throw new BadRequestException('Invalid credentials');

      const ok = await bcrypt.compare(dto.password, user.password);
      if (!ok) throw new BadRequestException('Invalid credentials');

      const access_token = this.jwtService.sign({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return { access_token, role: user.role, name: user.name };
    } catch (e) {
      this.handlePrismaError(e);
      throw e;
    }
  }
}
