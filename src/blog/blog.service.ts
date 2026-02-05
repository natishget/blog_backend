import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';

import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { find } from 'rxjs';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}
  async create(createBlogDto: CreateBlogDto, userId: number) {
    return await this.prisma.blogs.create({
      data: {
        ...createBlogDto,
        userId,
      },
    })
  }

  async findAll() {
    return await this.prisma.blogs.findMany({
      include: {
      user: {
        select: {
          name: true,
          email: true,
          bio: true,
        }
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          blogRatings: true,
        }
      }
    }
    })
  }

  async findOne(id: number) {
    return await this.prisma.blogs.findUnique({ where: { id },
      
      include: {
      user: {
        select: {
          name: true,
          email: true,
          bio: true,
        }
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          blogRatings: true,
        }
      }
    }
    
    })
    }

  async searchByTitleOrUserName(query: string){
    return await this.prisma.blogs.findMany({
      where: {
        OR: [
          { title: {contains: query, mode: 'insensitive'}},
          { user: { name: { contains: query, mode: 'insensitive'}}}
        ]
      }
    })
  }

  async update(id: number, updateBlogDto: UpdateBlogDto, userId: number) {
    const data = await this.prisma.blogs.findUnique({ where: { id }});
    if(!data){
      throw new NotFoundException('Blog not Found');
    }

    if(data.userId !== userId){
      throw new BadRequestException('You are not the owner of the blog');
    }

    return await this.prisma.blogs.update({
      where: {id},
      data: updateBlogDto,
    });
  }

      
  

  async remove(id: number, userId: number) {
    const data = await this.prisma.blogs.findUnique({ where: { id }});
    if(!data){
      throw new NotFoundException('Blog not Found');
    }

    if(data.userId !== userId){
      throw new BadRequestException('You are not the owner of the blog');
    }
    return await this.prisma.blogs.delete({ where: { id } });
  }

  async likeBlog(id: number, userId: number) {
    const data = await this.prisma.blogs.findUnique({ where: { id }});
    if(!data){
      throw new NotFoundException('Blog not Found');
    }

    const existingLike = await this.prisma.likes.findUnique({
      where: {
        userId_blogId: {
          userId,
          blogId: id,
        }
      }
    });

    if(existingLike){
      return await this.prisma.likes.delete({
        where: {
          id: existingLike.id,
        }
      })
    }
    return await this.prisma.likes.create({
      data: {
        userId,
        blogId: id,
      }
    })
  }

  async commentBlog(id: number, userId: number, comment: string) {
    const data = await this.prisma.blogs.findUnique({where: {id}});

    if(!data){
      throw new NotFoundException('Blog not Found');
    }

    return await this.prisma.comments.create({
      data: {
        userId,
        blogId: id,
        content: comment,
      }
    })
  }

  async getComments(id: number) {
    const data = await this.prisma.blogs.findUnique({ where: { id }});

    if(!data){
      throw new NotFoundException('Blog not Found');
    }

    return await this.prisma.comments.findMany({
      where: { blogId: id},
      include: {
      user: {
        select:{
          name: true,
          email: true,
          bio: true,
        }
      }
    }
    })
  }

  async editComment(id: number, userId: number, comment: string) {
    const data = await this.prisma.comments.findUnique({ where: { id}});

    if(!data){
      throw new NotFoundException('Comment not Found');
    }

    if(data.userId !== userId){
      throw new BadRequestException('You are not the owner of the comment');
    }

    return await this.prisma.comments.update({
      where: { id},
      data: {
        content: comment,
      }
    })
  }

  async deleteComment(id: number, userId: number) {
    const data = await this.prisma.comments.findUnique({ where: { id}});

    if(!data){
      throw new NotFoundException('Comment not Found');
    }

    if(data.userId !== userId){
      throw new BadRequestException('You are not the owner of the comment');
    }

    return await this.prisma.comments.delete({ where: { id }});
  }

  async rateBlog(id:number, userId: number, rating: number) {
    if(rating < 1 || rating > 5){
      throw new BadRequestException("Rating must be between 1 and 5");
    }

    const data = await this.prisma.blogs.findUnique({ where: { id }});

    if(!data){
      throw new NotFoundException("Blog not Found")
    }

    const existingRating = await this.prisma.blogRatings.findUnique({
      where: {
        userId_blogId:{
          userId,
          blogId: id,
        }
      }
    })

    if(existingRating){
      return await this.prisma.blogRatings.update({
        where: {
          id: existingRating.id,
        },
        data: {
          rating
        }
      })
    }

    return await this.prisma.blogRatings.create({
      data: {
        userId,
        blogId: id,
        rating,
      }
    })
  }
}
