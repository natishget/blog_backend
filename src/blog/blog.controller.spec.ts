import { Test, TestingModule } from '@nestjs/testing';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

describe('BlogController', () => {
  let controller: BlogController;
  let blogService: jest.Mocked<BlogService>;

  const blogServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    searchByTitleOrUserName: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    likeBlog: jest.fn(),
    commentBlog: jest.fn(),
    getComments: jest.fn(),
    editComment: jest.fn(),
    deleteComment: jest.fn(),
    rateBlog: jest.fn(),
  };

  const reqWithUserId = { user: { userId: 10, role: 'user' } } as any;
  const reqWithId = { user: { id: 11, role: 'user' } } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogController],
      providers: [
        {
          provide: BlogService,
          useValue: blogServiceMock,
        },
      ],
    }).compile();

    controller = module.get<BlogController>(BlogController);
    blogService = module.get(BlogService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create calls service with dto and userId', async () => {
    const dto = { title: 't', content: 'c' } as any;
    blogService.create.mockResolvedValue({ id: 1 } as any);

    await controller.create(dto, reqWithUserId);

    expect(blogService.create).toHaveBeenCalledWith(dto, 10);
  });

  it('findAll uses userId from userId and role', async () => {
    blogService.findAll.mockResolvedValue([{ id: 1 }] as any);

    await controller.findAll(reqWithUserId);

    expect(blogService.findAll).toHaveBeenCalledWith(10, 'user');
  });

  it('findAll falls back to user.id', async () => {
    blogService.findAll.mockResolvedValue([{ id: 1 }] as any);

    await controller.findAll(reqWithId);

    expect(blogService.findAll).toHaveBeenCalledWith(11, 'user');
  });

  it('search calls service with query', async () => {
    blogService.searchByTitleOrUserName.mockResolvedValue([{ id: 1 }] as any);

    await controller.search('nestjs');

    expect(blogService.searchByTitleOrUserName).toHaveBeenCalledWith('nestjs');
  });

  it('findOne calls service with id and user info', async () => {
    blogService.findOne.mockResolvedValue({ id: 1 } as any);

    await controller.findOne(5, reqWithUserId);

    expect(blogService.findOne).toHaveBeenCalledWith(5, 10, 'user');
  });

  it('update calls service with id, dto, user, and role', async () => {
    const dto = { title: 'new' } as any;
    blogService.update.mockResolvedValue({ id: 1 } as any);

    await controller.update(7, dto, reqWithUserId);

    expect(blogService.update).toHaveBeenCalledWith(7, dto, 10, 'user');
  });

  it('remove calls service with id, user, and role', async () => {
    blogService.remove.mockResolvedValue({ id: 1 } as any);

    await controller.remove(8, reqWithUserId);

    expect(blogService.remove).toHaveBeenCalledWith(8, 10, 'user');
  });

  it('like calls service with id and user', async () => {
    blogService.likeBlog.mockResolvedValue({ message: 'Blog liked' } as any);

    await controller.like(9, reqWithUserId);

    expect(blogService.likeBlog).toHaveBeenCalledWith(9, 10);
  });

  it('comment calls service with id, user, and comment', async () => {
    blogService.commentBlog.mockResolvedValue({ id: 1 } as any);

    await controller.comment(3, reqWithUserId, 'Nice');

    expect(blogService.commentBlog).toHaveBeenCalledWith(3, 10, 'Nice');
  });

  it('getComments calls service with id', async () => {
    blogService.getComments.mockResolvedValue([] as any);

    await controller.getComments(4);

    expect(blogService.getComments).toHaveBeenCalledWith(4);
  });

  it('editComment calls service with id, user, comment, role', async () => {
    blogService.editComment.mockResolvedValue({ id: 1 } as any);

    await controller.editComment(2, reqWithUserId, 'Edit');

    expect(blogService.editComment).toHaveBeenCalledWith(2, 10, 'Edit', 'user');
  });

  it('deleteComment calls service with id, user, role', async () => {
    blogService.deleteComment.mockResolvedValue({ id: 1 } as any);

    await controller.deleteComment(6, reqWithUserId);

    expect(blogService.deleteComment).toHaveBeenCalledWith(6, 10, 'user');
  });

  it('rate calls service with id, user, rating', async () => {
    blogService.rateBlog.mockResolvedValue({ id: 1 } as any);

    await controller.rate(12, reqWithUserId, 5);

    expect(blogService.rateBlog).toHaveBeenCalledWith(12, 10, 5);
  });
});
