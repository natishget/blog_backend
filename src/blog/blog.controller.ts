import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createBlogDto: CreateBlogDto, @Req() req: any) {
    const userId = req.user.id;
    return this.blogService.create(createBlogDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.blogService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(@Param('query') query: string) {
    return this.blogService.searchByTitleOrUserName(query);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto, @Req() req: any) {
    const userId = req.user.id;
    return this.blogService.update(+id, updateBlogDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.blogService.remove(+id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('like/:id')
  like(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.blogService.likeBlog(+id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('comment/:id')
  comment(@Param('id') id: string, @Req() req: any, @Body('comment') comment: string) {
    const userId = req.user.id;
    return this.blogService.commentBlog(+id, userId, comment);
  }

  @UseGuards(JwtAuthGuard)
  @Get('comments/:id')
  getComments(@Param('id') id: string) {
    return this.blogService.getComments(+id);

  }

  @UseGuards(JwtAuthGuard)
  @Patch('comment/:id')
  editComment(@Param('id') id: string, @Req() req: any, @Body('comment') comment: string) {
    const userId = req.user.id;
    return this.blogService.editComment(+id, userId, comment);
  }

  @UseGuards(JwtAuthGuard)
  @Post('rate/:id')
  rate(@Param('id') id: string, @Req() req: any, @Body('rating') rating: number) {
    const userId = req.user.id;
    return this.blogService.rateBlog(+id, userId, rating);
  }
  }