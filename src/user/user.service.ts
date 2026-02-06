import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private handlePrismaError(e: unknown) {
    if (e && typeof e === 'object' && 'code' in (e as any)) {
      const err = e as Prisma.PrismaClientKnownRequestError;
      if (err.code === 'P2002') {
        throw new ConflictException('Email or username already registered');
      }
      throw new BadRequestException(err.message);
    }
    throw e;
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: createUserDto.email },
            { username: createUserDto.username },
          ],
        },
      });

      if (existingUser) {
        throw new ConflictException('Email or username already registered');
      }

      return await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          password: createUserDto.password,
          name: createUserDto.name ?? null,
          role: createUserDto.role,
          bio: createUserDto.bio ?? '',
          username: createUserDto.username,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          bio: true,
          username: true,
          createdAt: true,
        },
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          bio: true,
          username: true,
          createdAt: true,
        },
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          bio: true,
          username: true,
          createdAt: true,
        },
      });
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      return user;
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      let password: string | undefined;
      if (updateUserDto.password) {
        password = await bcrypt.hash(updateUserDto.password, 10);
      }

      if (updateUserDto.email || updateUserDto.username) {
        const conflict = await this.prisma.user.findFirst({
          where: {
            id: { not: id },
            OR: [
              updateUserDto.email ? { email: updateUserDto.email } : undefined,
              updateUserDto.username
                ? { username: updateUserDto.username }
                : undefined,
            ].filter(Boolean) as Prisma.UserWhereInput[],
          },
        });

        if (conflict) {
          throw new ConflictException('Email or username already registered');
        }
      }

      return await this.prisma.user.update({
        where: { id },
        data: {
          ...updateUserDto,
          ...(password ? { password } : {}),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          bio: true,
          username: true,
          createdAt: true,
        },
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async remove(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      return await this.prisma.user.delete({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          bio: true,
          username: true,
          createdAt: true,
        },
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }
}
