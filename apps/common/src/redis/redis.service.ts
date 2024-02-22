import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class RedisService {
  private _client: ReturnType<typeof createClient>;
  constructor(private readonly configService: ConfigService) {
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<string>('REDIS_PORT');

    createClient({ url: `redis://:${password}@${host}:${port}` })
      .on('error', (err) => {
        console.error(err);
      })
      .connect()
      .then((client) => (this._client = client));
  }

  public get client(): ReturnType<typeof createClient> {
    return this._client;
  }
}
