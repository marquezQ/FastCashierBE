import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get('sales')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener rendimiento de ventas por rango de fechas' })
  @ApiQuery({ name: 'start', description: 'Fecha de inicio (YYYY-MM-DD)', example: '2024-03-01' })
  @ApiQuery({ name: 'end', description: 'Fecha de fin (YYYY-MM-DD)', example: '2024-03-12' })
  @ApiResponse({ status: 200, description: 'Datos de ventas agrupados.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async getSalesPerformance(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.reportsService.getSalesPerformance(start, end);
  }
}
