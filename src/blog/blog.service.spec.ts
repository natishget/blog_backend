import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BlogService } from './blog.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('BlogService', () => {
  let service: BlogService;
  let prisma: any;

  const prismaMock = {
    blogs: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    likes: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    comments: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    blogRatings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<BlogService>(BlogService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a blog when userId is provided', async () => {
      prisma.blogs.create.mockResolvedValue({ id: 1 } as any);
      const dto = { title: 't', content: 'c' } as any;

      const result = await service.create(dto, 10);

      expect(result).toEqual({ id: 1 });
      expect(prisma.blogs.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          user: { connect: { id: 10 } },
        },
      });
    });

    it('throws when userId is missing', async () => {
      await expect(
        service.create({} as any, undefined as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('adds rating stats and isLikedByMe', async () => {
      prisma.blogs.findMany.mockResolvedValue([
        {
          id: 1,
          title: 't',
          content: 'c',
          userId: 99,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { name: 'u', email: 'e', bio: 'b' },
          _count: { likes: 1, comments: 0, blogRatings: 2 },
          blogRatings: [{ rating: 5 }, { rating: 3 }],
          likes: [{ userId: 10 }],
        },
      ]);

      const result = (await service.findAll(10, 'user')) as any[];

      expect(result[0].totalRating).toBe(8);
      expect(result[0].averageRating).toBe(4);
      expect(result[0].isLikedByMe).toBe(true);
    });

    it('does not set isLikedByMe for admin or owner', async () => {
      prisma.blogs.findMany.mockResolvedValue([
        {
          id: 2,
          title: 't',
          content: 'c',
          userId: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { name: 'u', email: 'e', bio: 'b' },
          _count: { likes: 1, comments: 0, blogRatings: 0 },
          blogRatings: [],
          likes: [{ userId: 10 }],
        },
      ]);

      const result = (await service.findAll(10, 'admin')) as any[];

      expect(result[0].isLikedByMe).toBe(false);
    });
  });

  describe('findOne', () => {
    it('returns blog with rating stats', async () => {
      prisma.blogs.findUnique.mockResolvedValue({
        id: 1,
        title: 't',
        content: 'c',
        userId: 99,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { name: 'u', email: 'e', bio: 'b' },
        _count: { likes: 1, comments: 0, blogRatings: 2 },
        blogRatings: [{ rating: 5 }, { rating: 1 }],
        likes: [{ userId: 10 }],
      });

      const result = (await service.findOne(1, 10, 'user')) as any;

      expect(result.totalRating).toBe(6);
      expect(result.averageRating).toBe(3);
      expect(result.isLikedByMe).toBe(true);
    });

    it('throws when blog not found', async () => {
      prisma.blogs.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1, 10, 'user')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('searchByTitleOrUserName', () => {
    it('throws on empty query', async () => {
      await expect(service.searchByTitleOrUserName('')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('returns results for valid query', async () => {
      prisma.blogs.findMany.mockResolvedValue([{ id: 1 }] as any);

      const result = await service.searchByTitleOrUserName('nest');

      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('update', () => {
    it('updates when owner or admin', async () => {
      prisma.blogs.findUnique.mockResolvedValue({ id: 1, userId: 10 });
      prisma.blogs.update.mockResolvedValue({ id: 1 } as any);

      const result = await service.update(1, { title: 'x' } as any, 10, 'user');

      expect(result).toEqual({ id: 1 });
    });

    it('throws when not owner and not admin', async () => {
      prisma.blogs.findUnique.mockResolvedValue({ id: 1, userId: 99 });

      await expect(
        service.update(1, { title: 'x' } as any, 10, 'user'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deletes when owner or admin', async () => {
      prisma.blogs.findUnique.mockResolvedValue({ id: 1, userId: 10 });
      prisma.blogs.delete.mockResolvedValue({ id: 1 } as any);

      const result = await service.remove(1, 10, 'user');

      expect(result).toEqual({ id: 1 });
    });
  });

  describe('likeBlog', () => {
    it('likes when not already liked', async () => {
      prisma.blogs.findUnique.mockResolvedValue({ id: 1, userId: 99 });
      prisma.likes.findUnique.mockResolvedValue(null);
      prisma.likes.create.mockResolvedValue({ id: 1 } as any);

      const result = await service.likeBlog(1, 10);

      expect(result).toEqual({ message: 'Blog liked' });
    });

    it('unlikes when already liked', async () => {
      prisma.blogs.findUnique.mockResolvedValue({ id: 1, userId: 99 });
      prisma.likes.findUnique.mockResolvedValue({ id: 5 });

      const result = await service.likeBlog(1, 10);

      expect(result).toEqual({ message: 'Blog unliked' });
    });
  });

  describe('commentBlog', () => {
    it('creates comment with valid input', async () => {
      prisma.blogs.findUnique.mockResolvedValue({ id: 1, userId: 99 });
      prisma.comments.create.mockResolvedValue({ id: 1 } as any);

      const result = await service.commentBlog(1, 10, 'Nice');

      expect(result).toEqual({ id: 1 });
    });

    it('throws when comment is empty', async () => {
      await expect(service.commentBlog(1, 10, '')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('getComments', () => {
    it('returns comments for blog', async () => {
      prisma.blogs.findUnique.mockResolvedValue({ id: 1 });
      prisma.comments.findMany.mockResolvedValue([{ id: 1 }] as any);

      const result = await service.getComments(1);

      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('editComment', () => {
    it('updates comment for owner or admin', async () => {
      prisma.comments.findUnique.mockResolvedValue({ id: 1, userId: 10 });
      prisma.comments.update.mockResolvedValue({ id: 1 } as any);

      const result = await service.editComment(1, 10, 'Edit', 'user');

      expect(result).toEqual({ id: 1 });
    });
  });

  describe('deleteComment', () => {
    it('deletes comment for owner or admin', async () => {
      prisma.comments.findUnique.mockResolvedValue({ id: 1, userId: 10 });
      prisma.comments.delete.mockResolvedValue({ id: 1 } as any);

      const result = await service.deleteComment(1, 10, 'user');

      expect(result).toEqual({ id: 1 });
    });
  });

  describe('rateBlog', () => {
    it('creates rating when not existing', async () => {
      prisma.blogs.findUnique.mockResolvedValue({ id: 1, userId: 99 });
      prisma.blogRatings.findUnique.mockResolvedValue(null);
      prisma.blogRatings.create.mockResolvedValue({ id: 1 } as any);

      const result = await service.rateBlog(1, 10, 5);

      expect(result).toEqual({ id: 1 });
    });

    it('updates rating when existing', async () => {
      prisma.blogs.findUnique.mockResolvedValue({ id: 1, userId: 99 });
      prisma.blogRatings.findUnique.mockResolvedValue({ id: 2 });
      prisma.blogRatings.update.mockResolvedValue({ id: 2 } as any);

      const result = await service.rateBlog(1, 10, 4);

      expect(result).toEqual({ id: 2 });
    });
  });
});
