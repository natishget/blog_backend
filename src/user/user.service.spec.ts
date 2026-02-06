import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let prisma: any;

  const prismaMock = {
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates user with defaults when not existing', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 1 } as any);

      const result = await service.create({
        email: 'a@b.com',
        password: 'pass1234',
        username: 'nat',
        role: 'user',
      } as any);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'a@b.com',
            username: 'nat',
            bio: '',
            name: null,
          }),
        }),
      );
      expect(result).toEqual({ id: 1 });
    });

    it('throws conflict when email or username exists', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 1 });

      await expect(
        service.create({
          email: 'a@b.com',
          password: 'pass1234',
          username: 'nat',
          role: 'user',
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('maps Prisma P2002 to ConflictException', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      const prismaError = new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: '6.12.0',
      });
      prisma.user.create.mockRejectedValue(prismaError);

      await expect(
        service.create({
          email: 'a@b.com',
          password: 'pass1234',
          username: 'nat',
          role: 'user',
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns users list', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1 }] as any);

      const result = await service.findAll();

      expect(result).toEqual([{ id: 1 }]);
    });

    it('maps Prisma error to BadRequestException', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('err', {
        code: 'P2000',
        clientVersion: '6.12.0',
      });
      prisma.user.findMany.mockRejectedValue(prismaError);

      await expect(service.findAll()).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('returns user when found', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 } as any);

      const result = await service.findOne(1);

      expect(result).toEqual({ id: 1 });
    });

    it('throws NotFound when user missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates existing user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      prisma.user.update.mockResolvedValue({ id: 1 } as any);

      const result = await service.update(1, { name: 'new' } as any);

      expect(result).toEqual({ id: 1 });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it('hashes password when provided', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);
      prisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      prisma.user.update.mockResolvedValue({ id: 1 } as any);

      await service.update(1, { password: 'newpass123' } as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ password: 'hashed' }),
        }),
      );
    });

    it('throws NotFound when user missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update(1, { name: 'new' } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes existing user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 } as any);
      prisma.user.delete.mockResolvedValue({ id: 1 } as any);

      const result = await service.remove(1);

      expect(result).toEqual({ id: 1 });
    });

    it('throws NotFound when user missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
