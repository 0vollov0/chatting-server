import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway(+process.env.SOCKET_PORT, {
  cors: {
    origin: '*',
    methods: ['GET'],
    credentials: true,
  },
  maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
})
export class ChattingGateway {
  @SubscribeMessage('message')
  handleMessage(): string {
    return 'Hello world!';
  }
}
