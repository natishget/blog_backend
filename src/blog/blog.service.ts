import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  private handlePrismaError(e: unknown) {
    if (e && typeof e === 'object' && 'code' in (e as any)) {
      const err = e as Prisma.PrismaClientKnownRequestError;
      if (err.code === 'P2002') {
        throw new ConflictException('Duplicate record');
      }
      throw new BadRequestException(err.message);
    }
    throw e;
  }

  async create(createBlogDto: CreateBlogDto, userId: number) {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required to create a blog');
      }

      return await this.prisma.blogs.create({
        data: {
          ...createBlogDto,
          user: {
            connect: { id: userId },
          },
        },
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async findAll(userId: number, role: string) {
    try {
      const blogs = await this.prisma.blogs.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
              bio: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              blogRatings: true,
            },
          },
          blogRatings: {
            select: {
              rating: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
        },
      });

      return blogs.map((b) => {
        const ratings = b.blogRatings ?? [];
        const totalRating = ratings.reduce((s, r) => s + r.rating, 0);
        const averageRating = ratings.length ? totalRating / ratings.length : 0;

        let isLikedByMe = false;
        if (
          typeof userId === 'number' &&
          role !== 'admin' &&
          b.userId !== userId
        ) {
          isLikedByMe = (b.likes ?? []).some((l) => l.userId === userId);
        }

        return {
          id: b.id,
          title: b.title,
          content: b.content,
          userId: b.userId,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          user: b.user,
          _count: b._count,
          totalRating,
          averageRating,
          isLikedByMe,
        };
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async findOne(id: number, userId: number, role: string) {
    try {
      const b = await this.prisma.blogs.findUnique({
        where: { id },

        include: {
          user: {
            select: {
              name: true,
              email: true,
              bio: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              blogRatings: true,
            },
          },
          blogRatings: {
            select: {
              rating: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!b) {
        throw new NotFoundException('Blog not Found');
      }

      const ratings = b.blogRatings ?? [];
      const totalRating = ratings.reduce((s, r) => s + r.rating, 0);
      const averageRating = ratings.length ? totalRating / ratings.length : 0;

      let isLikedByMe = false;
      if (
        typeof userId === 'number' &&
        role !== 'admin' &&
        b.userId !== userId
      ) {
        isLikedByMe = (b.likes ?? []).some((l) => l.userId === userId);
      }

      return {
        id: b.id,
        title: b.title,
        content: b.content,
        userId: b.userId,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        user: b.user,
        _count: b._count,
        totalRating,
        averageRating,
        isLikedByMe,
      };
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async searchByTitleOrUserName(query: string) {
    try {
      if (!query || !query.trim()) {
        throw new BadRequestException('Query is required');
      }
      return await this.prisma.blogs.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { user: { name: { contains: query, mode: 'insensitive' } } },
          ],
        },
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async update(
    id: number,
    updateBlogDto: UpdateBlogDto,
    userId: number,
    role: string,
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required');
      }
      const data = await this.prisma.blogs.findUnique({ where: { id } });
      if (!data) {
        throw new NotFoundException('Blog not Found');
      }

      if (data.userId !== userId && role !== 'admin') {
        throw new BadRequestException('You are not the owner of the blog');
      }

      return await this.prisma.blogs.update({
        where: { id },
        data: updateBlogDto,
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async remove(id: number, userId: number, role: string) {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required');
      }
      const data = await this.prisma.blogs.findUnique({ where: { id } });
      if (!data) {
        throw new NotFoundException('Blog not Found');
      }

      if (data.userId !== userId && role !== 'admin') {
        throw new BadRequestException('You are not the owner of the blog');
      }
      return await this.prisma.blogs.delete({ where: { id } });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async likeBlog(id: number, userId: number) {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required');
      }
      const data = await this.prisma.blogs.findUnique({ where: { id } });
      if (!data) {
        throw new NotFoundException('Blog not Found');
      }

      if (data.userId === userId) {
        throw new BadRequestException('You cannot like your own blog');
      }

      const existingLike = await this.prisma.likes.findUnique({
        where: {
          userId_blogId: {
            userId,
            blogId: id,
          },
        },
      });

      if (existingLike) {
        await this.prisma.likes.delete({
          where: {
            id: existingLike.id,
          },
        });

        return { message: 'Blog unliked' };
      }
      await this.prisma.likes.create({
        data: {
          userId,
          blogId: id,
        },
      });
      return { message: 'Blog liked' };
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async commentBlog(id: number, userId: number, comment: string) {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required');
      }
      if (!comment || !comment.trim()) {
        throw new BadRequestException('Comment is required');
      }
      const data = await this.prisma.blogs.findUnique({ where: { id } });

      if (!data) {
        throw new NotFoundException('Blog not Found');
      }

      if (data.userId === userId) {
        throw new BadRequestException('You cannot comment on your own blog');
      }

      return await this.prisma.comments.create({
        data: {
          userId,
          blogId: id,
          content: comment,
        },
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async getComments(id: number) {
    try {
      const data = await this.prisma.blogs.findUnique({ where: { id } });

      if (!data) {
        throw new NotFoundException('Blog not Found');
      }

      return await this.prisma.comments.findMany({
        where: { blogId: id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              bio: true,
            },
          },
        },
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async editComment(id: number, userId: number, comment: string, role: string) {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required');
      }
      if (!comment || !comment.trim()) {
        throw new BadRequestException('Comment is required');
      }
      const data = await this.prisma.comments.findUnique({ where: { id } });

      if (!data) {
        throw new NotFoundException('Comment not Found');
      }

      if (data.userId !== userId && role !== 'admin') {
        throw new BadRequestException('You are not the owner of the comment');
      }

      return await this.prisma.comments.update({
        where: { id },
        data: {
          content: comment,
        },
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async deleteComment(id: number, userId: number, role: string) {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required');
      }
      const data = await this.prisma.comments.findUnique({ where: { id } });

      if (!data) {
        throw new NotFoundException('Comment not Found');
      }

      if (data.userId !== userId && role !== 'admin') {
        throw new BadRequestException('You are not the owner of the comment');
      }

      return await this.prisma.comments.delete({ where: { id } });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async rateBlog(id: number, userId: number, rating: number) {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required');
      }
      if (rating < 1 || rating > 5) {
        throw new BadRequestException('Rating must be between 1 and 5');
      }

      const data = await this.prisma.blogs.findUnique({ where: { id } });

      if (!data) {
        throw new NotFoundException('Blog not Found');
      }

      if (data.userId === userId) {
        throw new BadRequestException('You cannot rate your own blog');
      }

      const existingRating = await this.prisma.blogRatings.findUnique({
        where: {
          userId_blogId: {
            userId,
            blogId: id,
          },
        },
      });

      if (existingRating) {
        return await this.prisma.blogRatings.update({
          where: {
            id: existingRating.id,
          },
          data: {
            rating,
          },
        });
      }

      return await this.prisma.blogRatings.create({
        data: {
          userId,
          blogId: id,
          rating,
        },
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }
}
