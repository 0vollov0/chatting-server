import { JwtAuthGuard } from './jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { WsArgumentsHost } from '@nestjs/common/interfaces';
import { UnauthorizedException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let configService: ConfigService;
  
  beforeEach(() => {
    configService = new ConfigService();
    jest.spyOn(configService, 'get').mockReturnValue('mockSecret');
    guard = new JwtAuthGuard(configService);
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
    it('✅ Should return true if token is valid', () => {
      jest.spyOn(jwt, 'verify').mockReturnValue({ _id: 'user123' } as any);

      const result = guard.canActivate(mockContext('validToken'));
      expect(result).toBe(true);
      expect(jwt.verify).toHaveBeenCalledWith('validToken', 'mockSecret', { ignoreExpiration: false });
    });

    it('❌ Should throw WsException if token is missing', () => {
      expect(() => guard.canActivate(mockContext(undefined))).toThrow(WsException);
      expect(() => guard.canActivate(mockContext(undefined))).toThrow('Access token is missing');
    });

    it('❌ Should throw WsException if token is invalid', () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new UnauthorizedException('Invalid token');
      });

      expect(() => guard.canActivate(mockContext('invalidToken'))).toThrow(WsException);
      expect(() => guard.canActivate(mockContext('invalidToken'))).toThrow('Invalid token');
    });
  });
});