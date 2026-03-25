import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Order } from './entities/order.entity';

/**
 * @WebSocketGateway — Le dice a NestJS que esta clase es un servidor WebSocket.
 *
 * Opciones que pasamos:
 *  - cors: Necesario para que el navegador (frontend) pueda conectarse.
 *          Sin esto, el navegador bloquea la conexión por política de mismo origen.
 *  - namespace: Es como una "ruta" dentro del servidor de Socket.io.
 *               El cliente se conectará a: ws://localhost:3000/orders
 *               Esto nos permite tener múltiples namespaces independientes
 *               (ej: /orders, /kitchen, /admin) con lógica separada.
 */
@WebSocketGateway({
    cors: {
        origin: '*', // En producción, reemplazar con la URL exacta del frontend
    },
    namespace: '/orders',
})
export class OrdersGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    /**
     * @WebSocketServer — Inyecta la instancia del servidor de Socket.io.
     * Este objeto `server` es el que usaremos para EMITIR eventos a los clientes.
     * Es equivalente al "megáfono" que le habla a todos los conectados.
     */
    @WebSocketServer()
    server: Server;

    // Logger de NestJS para mostrar información en la consola del servidor
    private readonly logger = new Logger(OrdersGateway.name);

    constructor() { }

    /**
     * OnGatewayInit — Se ejecuta una vez cuando el Gateway está listo y escuchando.
     * Ideal para logs de inicio o configuración inicial del servidor WS.
     */
    afterInit(server: Server) {
        this.logger.log('🔌 Orders WebSocket Gateway initialized on namespace /orders');
    }

    /**
     * OnGatewayConnection — Se ejecuta CADA VEZ que un cliente se conecta.
     * `client` es el socket individual del cliente que acaba de conectarse.
     * client.id es un ID único autogenerado por Socket.io para esa conexión.
     */
    handleConnection(client: Socket) {
        this.logger.log(`✅ Client connected: ${client.id}`);
        // En Socket.io v4, los sockets del namespace están en `this.server.sockets`
        // pero el tipo `Namespace` no expone `.size` directamente en su definición TS.
        // Accedemos al Map subyacente mediante cast para contar las conexiones activas.
        const connectedCount = (this.server.sockets as unknown as Map<string, Socket>).size;
        this.logger.log(`   Total connected clients: ${connectedCount}`);
    }

    /**
     * OnGatewayDisconnect — Se ejecuta CADA VEZ que un cliente se desconecta.
     * Ocurre cuando el navegador se cierra, la red se cae, o el cliente
     * llama explícitamente a socket.disconnect().
     */
    handleDisconnect(client: Socket) {
        this.logger.log(`❌ Client disconnected: ${client.id}`);
    }

    /**
     * emitNewOrder — Método PÚBLICO que llamaremos desde OrdersService.
     *
     * `this.server.emit(eventName, data)` envía un evento a TODOS
     * los clientes conectados a este namespace (/orders).
     *
     * El cliente (frontend) escuchará con:
     *   socket.on('new_order', (order) => { ... })
     *
     * @param order — El objeto Order completo (con details, cashier, etc.)
     */
    emitNewOrder(order: Order) {
        if (this.server) {
            this.logger.log(`📢 Emitting new_order event for order: ${order.orderNumber}`);
            this.server.emit('new_order', order);
        }
    }

    /**
     * emitOrderStatusUpdated — Emite cuando un pedido cambia de estado.
     *
     * Útil para que la cocina vea en tiempo real cuando un pedido pasa de
     * PENDING → IN_PREPARATION → READY → DELIVERED, sin recargar la página.
     *
     * El cliente escuchará con:
     *   socket.on('order_status_updated', (order) => { ... })
     */
    emitOrderStatusUpdated(order: Order) {
        if (this.server) {
            this.logger.log(`🔄 Emitting order_status_updated for order: ${order.orderNumber} → ${order.orderStatus}`);
            this.server.emit('order_status_updated', order);
        }
    }

    /**
     * @SubscribeMessage — Escucha eventos que llegan DESDE el cliente.
     *
     * Esto es la comunicación en sentido inverso: cliente → servidor.
     * En este caso, el cliente puede enviar 'ping' para verificar que
     * la conexión está viva, y el servidor responde con 'pong'.
     *
     * No es obligatorio para el caso de uso de cocina, pero es útil
     * para depuración y para verificar que la conexión funciona.
     */
    @SubscribeMessage('ping')
    handlePing(@MessageBody() _data: unknown) {
        this.logger.log(`🏓 Ping received from client`);
        return { event: 'pong', data: 'Connection alive' };
    }
}
