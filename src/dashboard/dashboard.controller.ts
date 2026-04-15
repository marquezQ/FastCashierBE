import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('summary')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get consolidated admin dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Return metrics successfully.' })
  getDashboardSummary() {
    return this.dashboardService.getDashboardSummary();
  }
}
