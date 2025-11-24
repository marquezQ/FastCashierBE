import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard) //Proteger todo el controlador
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER pueden crear órdenes
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @Roles('ADMIN', 'CASHIER', 'KITCHEN') //Todos pueden ver órdenes
  findAll(@Query('status') status?: string) {
    if (status) {
      return this.ordersService.findByStatus(status.toUpperCase());
    }
    return this.ordersService.findAll();
  }

  @Get('pending')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN') //Todos (especialmente cocina)
  findPending() {
    return this.ordersService.findPendingOrders();
  }

  @Get('stats')
  @Roles('ADMIN', 'CASHIER') // solo ADMIN y CASHIER
  getStats(@Query('sessionId') sessionId?: number) {
    return this.ordersService.getOrderStats(sessionId);
  }

  @Get('session/:sessionId')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  findBySession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.ordersService.findBySession(sessionId);
  }

  @Get('number/:orderNumber')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN') //Todos
  findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Get(':id')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN') //Todos
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'CASHIER', 'KITCHEN') //Todos (cocina cambia estado)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateStatusDto);
  }

  @Post(':id/cancel')
  @Roles('ADMIN', 'CASHIER') //Solo ADMIN y CASHIER
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.cancel(id, reason);
  }

  @Delete(':id')
  @Roles('ADMIN') //Solo ADMIN puede eliminar
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.remove(id);
  }
}
