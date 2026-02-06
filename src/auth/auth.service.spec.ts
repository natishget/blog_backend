import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerUser', () => {
    it('creates user and returns sanitized data', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        name: 'Nat',
        role: 'user',
      });

      const result = await service.registerUser({
        email: 'a@b.com',
        username: 'nat',
        password: 'pass1234',
        role: 'user',
      } as any);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'a@b.com',
            username: 'nat',
            password: 'hashed',
          }),
        }),
      );
      expect(result).toEqual({
        id: 1,
        email: 'a@b.com',
        name: 'Nat',
        role: 'user',
      });
    });

    it('throws conflict when user exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });

      await expect(
        service.registerUser({
          email: 'a@b.com',
          username: 'nat',
          password: 'pass1234',
          role: 'user',
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('loginUser', () => {
    it('returns token, role, and name on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        name: 'Nat',
        role: 'user',
        password: 'hashed',
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jwt.sign.mockReturnValue('token');

      const result = await service.loginUser({
        username: 'nat',
        password: 'pass1234',
      } as any);

      expect(jwt.sign).toHaveBeenCalledWith({
        userId: 1,
        email: 'a@b.com',
        name: 'Nat',
        role: 'user',
      });
      expect(result).toEqual({
        access_token: 'token',
        role: 'user',
        name: 'Nat',
      });
    });

    it('throws invalid credentials when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.loginUser({ username: 'nat', password: 'pass1234' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws invalid credentials when password mismatch', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        name: 'Nat',
        role: 'user',
        password: 'hashed',
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.loginUser({ username: 'nat', password: 'pass1234' } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
