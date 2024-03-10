import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './local-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { ApiResponse } from '@nestjs/swagger';
import { AuthJoinResponse } from './api-response';
import { Me } from '../users/decorators/user.decorator';
import { User } from 'apps/common/src/schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('join')
  @ApiResponse({
    status: 201,
    type: AuthJoinResponse,
  })
  join(@Body() dto: CreateUserDto) {
    return this.authService.join(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Me() user: User) {
    return user;
  }
}
