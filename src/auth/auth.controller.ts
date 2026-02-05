import { Body, Controller, Post, Get, Req, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: any;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.authService.registerUser(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto, @Res({ passthrough: true }) res: Response) {
    const { access_token, role, name } = await this.authService.loginUser(dto);

    if (!access_token) {
      throw new BadRequestException('Failed to issue token');
    }

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.IS_PRODUCTION === 'true',
      sameSite: process.env.IS_PRODUCTION === 'true' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return { role };
  }

  @UseGuards(JwtAuthGuard)
  @Get('protected')
  getMe(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }
}
