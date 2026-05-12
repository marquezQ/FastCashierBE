import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener rendimiento de ventas' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['DAY', 'WEEK', 'MONTH', 'YEAR'],
    description: 'Periodo de agrupación predefinido',
  })
  @ApiQuery({
    name: 'start',
    required: false,
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2024-03-01',
  })
  @ApiQuery({
    name: 'end',
    required: false,
    description: 'Fecha de fin (YYYY-MM-DD)',
    example: '2024-03-12',
  })
  @ApiResponse({ status: 200, description: 'Datos de ventas agrupados.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async getSalesPerformance(
    @Query('period') period?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.reportsService.getSalesPerformance(period, start, end);
  }

  @Get('payment-methods')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener métodos de pago (Efectivo vs QR)' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['DAY', 'WEEK', 'MONTH', 'YEAR'],
    description: 'Periodo de agrupación predefinido',
  })
  @ApiQuery({
    name: 'start',
    required: false,
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2024-03-01',
  })
  @ApiQuery({
    name: 'end',
    required: false,
    description: 'Fecha de fin (YYYY-MM-DD)',
    example: '2024-03-12',
  })
  @ApiResponse({ status: 200, description: 'Datos de métodos de pago.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async getPaymentMethodsPerformance(
    @Query('period') period?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.reportsService.getPaymentMethodsPerformance(period, start, end);
  }

  @Get('order-types')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener tipos de pedido (Mesa vs Llevar)' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['DAY', 'WEEK', 'MONTH', 'YEAR'],
    description: 'Periodo de agrupación predefinido',
  })
  @ApiQuery({
    name: 'start',
    required: false,
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2024-03-01',
  })
  @ApiQuery({
    name: 'end',
    required: false,
    description: 'Fecha de fin (YYYY-MM-DD)',
    example: '2024-03-12',
  })
  @ApiResponse({ status: 200, description: 'Datos de tipos de pedido.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async getOrderTypesPerformance(
    @Query('period') period?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.reportsService.getOrderTypesPerformance(period, start, end);
  }
}
