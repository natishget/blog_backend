import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const authServiceMock = {
    registerUser: jest.fn(),
    loginUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register calls authService.registerUser', async () => {
    const dto = {
      email: 'a@b.com',
      password: 'pass1234',
      username: 'u',
    } as any;
    authService.registerUser.mockResolvedValue({ id: 1 } as any);

    const result = await controller.register(dto);

    expect(authService.registerUser).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1 });
  });

  it('login sets cookie and returns name/role', async () => {
    authService.loginUser.mockResolvedValue({
      access_token: 'token',
      role: 'user',
      name: 'Nat',
    } as any);

    const res = {
      cookie: jest.fn(),
    } as any;

    const result = await controller.login(
      { email: 'a@b.com', password: 'pass1234' } as any,
      res,
    );

    expect(authService.loginUser).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'token',
      expect.objectContaining({
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      }),
    );
    expect(result).toEqual({ name: 'Nat', role: 'user' });
  });

  it('login throws when access_token missing', async () => {
    authService.loginUser.mockResolvedValue({
      access_token: '',
      role: 'user',
      name: 'Nat',
    } as any);

    await expect(
      controller.login(
        { email: 'a@b.com', password: 'pass1234' } as any,
        { cookie: jest.fn() } as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getMe returns req.user', () => {
    const req = { user: { id: 1, email: 'a@b.com' } } as any;

    const result = controller.getMe(req);

    expect(result).toEqual(req.user);
  });

  it('logout clears cookie and returns message', () => {
    const res = { clearCookie: jest.fn() } as any;

    const result = controller.logout(res);

    expect(res.clearCookie).toHaveBeenCalledWith('access_token');
    expect(result).toEqual({ message: 'Logged out successfully' });
  });
});
