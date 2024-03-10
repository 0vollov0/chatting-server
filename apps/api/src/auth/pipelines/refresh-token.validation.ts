import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ConfigService } from '@nestjs/config';
import { AccessTokenPayload } from '../type';
import { UsersService } from '../../users/users.service';

@Injectable()
export class RefreshTokenValidation implements PipeTransform {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}
  async transform({
    accessToken,
    refreshToken,
  }: RefreshTokenDto): Promise<RefreshTokenDto> {
    try {
      const userPayload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        accessToken,
        {
          ignoreExpiration: true,
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );
      await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const user = await this.usersService.findById(userPayload._id);
      if (!user) throw new Error('??');
      return {
        accessToken,
        refreshToken,
        _id: userPayload._id,
      };
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
