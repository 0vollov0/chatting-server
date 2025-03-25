import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Model } from 'mongoose';
import { User } from '@common/schemas/user.schema';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@common/config/config.module';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Token, TokenSchema } from '@common/schemas/token.schema';
import { CommonModule } from '@common/common.module';
import { Logger } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let userModel: Model<User>;
  let tokenModel: Model<Token>;

  let testUser: User;
  let tokenAfterLogin: Pick<Token, 'accessToken' | 'refreshToken'>;
  let tokenAfterRefresh: Pick<Token, 'accessToken' | 'refreshToken'>;

  beforeAll(async () => {
    Logger.overrideLogger([]);

    const moduleRef = await Test.createTestingModule({
      imports: [
        CommonModule,
        UsersModule,
        PassportModule,
        JwtModule.registerAsync({
          global: true,
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET'),
            signOptions: { expiresIn: configService.get<string>('JWT_EXPIRE') },
          }),
        }),
        MongooseModule.forFeature([
          {
            name: Token.name,
            schema: TokenSchema,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [AuthService, LocalStrategy, JwtStrategy],
    }).compile();

    authController = moduleRef.get<AuthController>(AuthController);
    userModel = moduleRef.get<Model<User>>(getModelToken(User.name));
    tokenModel = moduleRef.get<Model<Token>>(getModelToken(Token.name));
  });

  describe('join', () => {
    it('should return user model with out password', async () => {
      const dto: CreateUserDto = {
        name: Math.random().toString(),
        password: Math.random().toString(),
      };
      testUser = await authController.join(dto);
      expect(testUser).toHaveProperty('name', dto.name);
      expect(testUser).toHaveProperty('_id');
      expect(testUser.password).toBeUndefined();
    });
  });

  describe('login', () => {
    it('should return accessToken and refreshToken as object type', async () => {
      tokenAfterLogin = await authController.login({
        _id: testUser._id.toString(),
        createdAt: testUser.createdAt,
        updatedAt: testUser.updatedAt,
      });
      expect(tokenAfterLogin).toHaveProperty('accessToken');
      expect(tokenAfterLogin).toHaveProperty('refreshToken');
    });
  });

  describe('refresh', () => {
    it('should return accessToken and refreshToken as object type', async () => {
      tokenAfterRefresh = await authController.refreshToken({
        _id: testUser._id,
        accessToken: tokenAfterLogin.accessToken,
        refreshToken: tokenAfterLogin.refreshToken,
      });

      expect(tokenAfterRefresh).toHaveProperty('accessToken');
      expect(tokenAfterRefresh).toHaveProperty('refreshToken');
    });
  });

  afterAll(async () => {
    if (testUser) {
      await userModel.deleteOne({
        _id: testUser._id,
      });
    }
    if (tokenAfterLogin) {
      await tokenModel.deleteMany({
        accessToken: tokenAfterLogin.accessToken,
        refreshToken: tokenAfterLogin.refreshToken,
      });
    }
    if (tokenAfterRefresh) {
      await tokenModel.deleteMany({
        accessToken: tokenAfterRefresh.accessToken,
        refreshToken: tokenAfterRefresh.refreshToken,
      });
    }
  });
});
