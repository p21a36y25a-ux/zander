import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { PunchEventPayload } from '@liana/shared';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PunchEventsGateway {
  @WebSocketServer()
  server!: Server;

  emitPunchEvent(payload: PunchEventPayload) {
    this.server.emit('punch.created', payload);
  }
}
