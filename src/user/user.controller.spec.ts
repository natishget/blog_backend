import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const userServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userServiceMock,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create allows admin', async () => {
    const dto = {
      email: 'a@b.com',
      username: 'u',
      password: 'pass1234',
    } as any;
    userService.create.mockResolvedValue({ id: 1 } as any);

    const result = await controller.create(dto, {
      user: { role: 'admin' },
    } as any);

    expect(userService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1 });
  });

  it('create forbids non-admin', async () => {
    expect(() =>
      controller.create({} as any, { user: { role: 'user' } } as any),
    ).toThrow(ForbiddenException);
  });

  it('findAll allows admin', async () => {
    userService.findAll.mockResolvedValue([{ id: 1 }] as any);

    const result = await controller.findAll({ user: { role: 'admin' } } as any);

    expect(userService.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1 }]);
  });

  it('findAll forbids non-admin', async () => {
    expect(() => controller.findAll({ user: { role: 'user' } } as any)).toThrow(
      ForbiddenException,
    );
  });

  it('findOne calls service', async () => {
    userService.findOne.mockResolvedValue({ id: 2 } as any);

    const result = await controller.findOne(2);

    expect(userService.findOne).toHaveBeenCalledWith(2);
    expect(result).toEqual({ id: 2 });
  });

  it('update allows self', async () => {
    userService.update.mockResolvedValue({ id: 1 } as any);

    const result = await controller.update(
      1,
      { user: { userId: 1, role: 'user' } } as any,
      { name: 'n' } as any,
    );

    expect(userService.update).toHaveBeenCalledWith(1, { name: 'n' });
    expect(result).toEqual({ id: 1 });
  });

  it('update allows admin', async () => {
    userService.update.mockResolvedValue({ id: 1 } as any);

    await controller.update(
      2,
      { user: { userId: 1, role: 'admin' } } as any,
      { name: 'n' } as any,
    );

    expect(userService.update).toHaveBeenCalledWith(2, { name: 'n' });
  });

  it('update forbids other user', async () => {
    expect(() =>
      controller.update(
        2,
        { user: { userId: 1, role: 'user' } } as any,
        { name: 'n' } as any,
      ),
    ).toThrow(ForbiddenException);
  });

  it('remove allows self', async () => {
    userService.remove.mockResolvedValue({ id: 1 } as any);
    const res = { clearCookie: jest.fn() } as any;

    const result = await controller.remove(
      1,
      { user: { id: 1, role: 'user' } } as any,
      res,
    );

    expect(userService.remove).toHaveBeenCalledWith(1);
    expect(res.clearCookie).toHaveBeenCalledWith('access_token');
    expect(result).toEqual({ id: 1 });
  });

  it('remove allows admin', async () => {
    userService.remove.mockResolvedValue({ id: 1 } as any);
    const res = { clearCookie: jest.fn() } as any;

    await controller.remove(2, { user: { id: 1, role: 'admin' } } as any, res);

    expect(userService.remove).toHaveBeenCalledWith(2);
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  it('remove forbids other user', async () => {
    expect(() =>
      controller.remove(
        2,
        { user: { id: 1, role: 'user' } } as any,
        { clearCookie: jest.fn() } as any,
      ),
    ).toThrow(ForbiddenException);
  });
});
