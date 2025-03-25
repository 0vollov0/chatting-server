import { UserExistAuthGuard } from './user-exist-auth.guard';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@api/users/users.service';
import * as jwt from 'jsonwebtoken';
import { WsArgumentsHost } from '@nestjs/common/interfaces';
import { UnauthorizedException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { TUserPayload } from '@api/users/decorators/user.decorator';

describe('UserExistAuthGuard', () => {
  let guard: UserExistAuthGuard;
  let configService: ConfigService;
  let usersService: UsersService;

  beforeEach(() => {
    configService = new ConfigService();
    usersService = {
      findById: jest.fn(),
    } as unknown as UsersService;

    jest.spyOn(configService, 'get').mockReturnValue('mockSecret');
    guard = new UserExistAuthGuard(configService, usersService);
  });

  const mockClient = (token?: string) => ({
    handshake: { auth: { accessToken: token } },
  });

  const mockContext = (token?: string) => ({
    switchToWs: () => ({
      getClient: () => mockClient(token),
    }),
  } as unknown as WsArgumentsHost);

  describe('canActivate()', () => {
    it('✅ Should return true if token is valid and user exists', async () => {
      const payload: TUserPayload = {
        _id: '6603f9bcb2d5a5f8c8a6f2e3',
        createdAt: new Date(),
        updatedAt: new Date() 
      }
      jest.spyOn(jwt, 'verify').mockReturnValue(payload as never);
      jest.spyOn(usersService, 'findById').mockResolvedValue({
        _id: '6603f9bcb2d5a5f8c8a6f2e3',
        name: '',
        password: '',
        createdAt: new Date(),
        updatedAt: new Date() 
      });

      const result = await guard.canActivate(mockContext('validToken'));
      expect(result).toBe(true);
      expect(usersService.findById).toHaveBeenCalledWith('6603f9bcb2d5a5f8c8a6f2e3');
    });

    it('❌ Should throw WsException if token is missing', async () => {
      await expect(guard.canActivate(mockContext(undefined))).rejects.toThrow(WsException);
      await expect(guard.canActivate(mockContext(undefined))).rejects.toThrow('Access token is missing');
    });

    it('❌ Should throw WsException if token is invalid', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new UnauthorizedException('Invalid token');
      });

      await expect(guard.canActivate(mockContext('invalidToken'))).rejects.toThrow(WsException);
      await expect(guard.canActivate(mockContext('invalidToken'))).rejects.toThrow('Invalid token');
    });

    it('✅ Should return false if token is valid but user does not exist', async () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ _id: 'user123' } as any);
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);

      const result = await guard.canActivate(mockContext('validToken'));
      expect(result).toBe(false);
    });
  });
});