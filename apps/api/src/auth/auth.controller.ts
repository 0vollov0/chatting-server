import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthJoinResponse, AuthLoginResponse } from './api-response';
import { TUserPayload, UserPayload } from '../users/decorators/user.decorator';

@ApiTags('auth')
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
  @ApiResponse({
    status: 200,
    type: AuthLoginResponse,
  })
  @Post('login')
  async login(@UserPayload() user: TUserPayload) {
    return this.authService.login(user);
  }
}
