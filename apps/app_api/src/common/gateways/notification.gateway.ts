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
     * Client gửi event 'join_room' sau khi connect.
     *
     * Payload có thể là:
     *   - string (legacy): userId
     *   - object: { userId: string; campus?: string }
     *
     * Nếu campus được cung cấp, client cũng join room "campus:<CAMPUS>"
     * để backend có thể sendToCampus() chính xác.
     */
    @SubscribeMessage('join_room')
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: string | { userId: string; campus?: string },
    ) {
        // Backward-compatible: accept both plain string and object
        const userId = typeof payload === 'string' ? payload : payload?.userId;
        const campus = typeof payload === 'object' ? payload?.campus : undefined;

        if (userId) {
            client.join(userId);
            this.logger.log(`Client ${client.id} joined user room: ${userId}`);
        }

        if (campus) {
            const campusRoom = `campus:${campus}`;
            client.join(campusRoom);
            this.logger.log(`Client ${client.id} joined campus room: ${campusRoom}`);
        }
    }

    /** Gửi thông báo tới toàn bộ clients */
    sendToAll(event: string, data: any) {
        this.server.emit(event, data);
    }

    /** Gửi cho một user cụ thể qua room userId */
    sendToUser(userId: string, event: string, data: any) {
        this.server.to(userId).emit(event, data);
    }

    /**
     * Gửi tới tất cả clients đã join room "campus:<campus>".
     * Dùng cho ticket notifications: chỉ notify exam officers cùng campus.
     */
    sendToCampus(campus: string, event: string, data: any) {
        const campusRoom = `campus:${campus}`;
        this.server.to(campusRoom).emit(event, data);
        this.logger.log(`Emitted '${event}' to campus room: ${campusRoom}`);
    }
}
