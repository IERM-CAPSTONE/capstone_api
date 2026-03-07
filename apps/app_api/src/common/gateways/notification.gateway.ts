import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*', // Trong thực tế nên giới hạn origin
    },
    namespace: 'notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationGateway.name);

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    /**
     * Client gửi event 'join_room' với userId sau khi connect
     * để backend có thể sendToUser() đúng người
     */
    @SubscribeMessage('join_room')
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() userId: string,
    ) {
        if (userId) {
            client.join(userId);
            this.logger.log(`Client ${client.id} joined room: ${userId}`);
        }
    }

    /**
     * Gửi thông báo tới toàn bộ clients hoặc theo room (userId)
     */
    sendToAll(event: string, data: any) {
        this.server.emit(event, data);
    }

    /**
     * Gửi cho một user cụ thể (giả sử họ join room là userId)
     */
    sendToUser(userId: string, event: string, data: any) {
        this.server.to(userId).emit(event, data);
    }
}
