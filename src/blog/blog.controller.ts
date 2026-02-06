import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
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
    const userId = req.user?.userId;
    return this.blogService.create(createBlogDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: any) {
    const userId = req.user?.userId ?? req.user?.id;
    const role = req.user?.role;
    return this.blogService.findAll(userId, role);
  }

  // blog search route
  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(@Query('query') query: string) {
    return this.blogService.searchByTitleOrUserName(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.userId ?? req.user?.id;
    const role = req.user?.role;
    return this.blogService.findOne(id, userId, role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBlogDto: UpdateBlogDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId ?? req.user?.id;
    const role = req.user?.role;
    return this.blogService.update(id, updateBlogDto, userId, role);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.userId ?? req.user?.id;
    const role = req.user?.role;
    return this.blogService.remove(id, userId, role);
  }

  // blog like related route
  @UseGuards(JwtAuthGuard)
  @Post('like/:id')
  like(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.userId ?? req.user?.id;
    return this.blogService.likeBlog(id, userId);
  }

  // blog comment related routes
  @UseGuards(JwtAuthGuard)
  @Post('comment/:id')
  comment(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body('comment') comment: string,
  ) {
    const userId = req.user?.userId ?? req.user?.id;
    return this.blogService.commentBlog(id, userId, comment);
  }

  @UseGuards(JwtAuthGuard)
  @Get('comment/:id')
  getComments(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.getComments(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('comment/:id')
  editComment(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body('comment') comment: string,
  ) {
    const userId = req.user?.userId ?? req.user?.id;
    const role = req.user?.role;
    return this.blogService.editComment(id, userId, comment, role);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comment/:id')
  deleteComment(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.userId ?? req.user?.id;
    const role = req.user?.role;
    return this.blogService.deleteComment(id, userId, role);
  }

  // blog rating related route

  @UseGuards(JwtAuthGuard)
  @Post('rate/:id')
  rate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body('rating') rating: number,
  ) {
    const userId = req.user?.userId ?? req.user?.id;
    return this.blogService.rateBlog(id, userId, rating);
  }
}
