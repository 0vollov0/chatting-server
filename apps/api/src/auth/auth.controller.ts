import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthJoinResponse, AuthLoginResponse } from './api-response';
import { TUserPayload, UserPayload } from '../users/decorators/user.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshTokenValidation } from './pipelines/refresh-token.validation';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('join')
  @ApiOperation({ summary: 'join for user' })
  @ApiResponse({
    status: 201,
    type: AuthJoinResponse,
  })
  join(@Body() dto: CreateUserDto) {
    return this.authService.join(dto);
  }

  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'In order to get tokens' })
  @ApiResponse({
    status: 200,
    type: AuthLoginResponse,
  })
  @Post('login')
  async login(@UserPayload() user: TUserPayload) {
    return this.authService.login(user);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'It is able to get tokens instead of login',
    description:
      'You can use this when you want to get new tokens using published tokens that not expired.',
  })
  @ApiResponse({
    status: 200,
    type: AuthLoginResponse,
    description:
      'You can use this when you want to get new tokens using previous published tokens.',
  })
  refreshToken(@Body(RefreshTokenValidation) dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }
}
