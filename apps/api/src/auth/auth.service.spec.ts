import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Token } from '@common/schemas/token.schema';
import { BadRequestException } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { User } from '@common/schemas/user.schema';
import { Model } from 'mongoose';
import { TUserPayload } from '@api/users/decorators/user.decorator';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let tokenModel: Model<Token>;

  beforeEach(async () => {
    const mockUserModel = {
      create: jest.fn().mockResolvedValue({
        _id: '6603f9bcb2d5a5f8c8a6f2e3',
        name: 'testUser',
        toObject: jest.fn().mockReturnValue({
          _id: '6603f9bcb2d5a5f8c8a6f2e3',
          name: 'testUser',
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            validate: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mockAccessToken'),
          },
        },
        {
          provide: getModelToken(Token.name),
          useValue: {
            insertOne: jest.fn(),
            findOne: jest.fn(),
            deleteOne: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    tokenModel = module.get<Model<Token>>(getModelToken(Token.name));
  });

  const mockUser = {
    _id: '6603f9bcb2d5a5f8c8a6f2e3',
    name: 'testUser',
    password: 'hashedPassword',
    toObject: () => {
      return {
        _id: '6603f9bcb2d5a5f8c8a6f2e3',
        name: 'testUser',
        password: 'hashedPassword',
      };
    },
  };

  it('✅ Should register a new user and return user without password', async () => {
    jest.spyOn(usersService, 'create').mockResolvedValue(mockUser as any);

    const createUserDto: CreateUserDto = {
      name: 'testUser',
      password: 'Secure@1234',
    };

    const result = await authService.join(createUserDto);

    expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    expect(result).toEqual({ _id: mockUser._id, name: mockUser.name });
  });

  it('❌ Should throw error if user registration fails', async () => {
    jest
      .spyOn(usersService, 'create')
      .mockRejectedValue(new BadRequestException('User creation failed'));

    await expect(
      authService.join({ name: 'invalidUser', password: 'weak' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('✅ Should log in and return tokens', async () => {
    const userPayload: TUserPayload = {
      _id: mockUser._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await authService.login(userPayload);

    expect(result).toEqual({
      accessToken: 'mockAccessToken',
      refreshToken: 'mockAccessToken',
    });
    expect(jwtService.sign).toHaveBeenCalledTimes(2);
  });

  it('✅ Should refresh token successfully', async () => {
    jest.spyOn(tokenModel, 'findOne').mockResolvedValue(true);
    jest
      .spyOn(tokenModel, 'deleteOne')
      .mockResolvedValue({ deletedCount: 1 } as any);

    const refreshTokenDto: RefreshTokenDto = {
      _id: mockUser._id,
      accessToken: 'oldAccessToken',
      refreshToken: 'validRefreshToken',
    };

    const result = await authService.refreshToken(refreshTokenDto);

    expect(result).toEqual({
      accessToken: 'mockAccessToken',
      refreshToken: 'mockAccessToken',
    });
    expect(tokenModel.deleteOne).toHaveBeenCalledWith({
      accessToken: 'oldAccessToken',
      refreshToken: 'validRefreshToken',
    });
  });

  it('❌ Should throw error when refresh token is invalid', async () => {
    jest.spyOn(tokenModel, 'findOne').mockResolvedValue(null);

    await expect(
      authService.refreshToken({
        _id: mockUser._id,
        accessToken: 'oldAccessToken',
        refreshToken: 'invalidRefreshToken',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('✅ Should validate user with correct credentials', async () => {
    jest.spyOn(usersService, 'validate').mockResolvedValue(mockUser as any);

    const result = await authService.validateUser('testUser', 'Secure@1234');

    expect(result).toEqual(mockUser);
    expect(usersService.validate).toHaveBeenCalledWith(
      'testUser',
      'Secure@1234',
    );
  });

  it('✅ Should return null if user validation fails', async () => {
    jest.spyOn(usersService, 'validate').mockResolvedValue(null);

    const result = await authService.validateUser('testUser', 'wrongPassword');

    expect(result).toBeNull();
  });

  it('✅ Should generate tokens successfully', async () => {
    const userPayload = { _id: mockUser._id };

    const result = await authService['publishToken'](userPayload);

    expect(result).toEqual({
      accessToken: 'mockAccessToken',
      refreshToken: 'mockAccessToken',
    });
    expect(jwtService.sign).toHaveBeenCalledTimes(2);
    expect(tokenModel.insertOne).toHaveBeenCalledWith({
      accessToken: 'mockAccessToken',
      refreshToken: 'mockAccessToken',
    });
  });
});
