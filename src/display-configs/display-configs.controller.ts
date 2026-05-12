import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DisplayConfigsService } from './display-configs.service';
import { CreateDisplayConfigDto, UpdateDisplayConfigDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Display Configs')
@ApiBearerAuth()
@Controller('display-configs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisplayConfigsController {
  constructor(private readonly displayConfigsService: DisplayConfigsService) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear configuración de pantalla',
    description:
      'Crea una nueva configuración de pantalla para menú digital. Genera automáticamente un código de acceso único de 6 caracteres.',
  })
  @ApiResponse({ status: 201, description: 'Configuración creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o categoría inexistente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos (requiere ADMIN)' })
  create(@Body() createDto: CreateDisplayConfigDto) {
    return this.displayConfigsService.create(createDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Listar todas las configuraciones de pantalla',
    description: 'Retorna todas las configuraciones ordenadas por fecha de creación descendente.',
  })
  @ApiResponse({ status: 200, description: 'Lista de configuraciones' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos (requiere ADMIN)' })
  findAll() {
    return this.displayConfigsService.findAll();
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Actualizar configuración de pantalla',
    description: 'Actualiza parcialmente una configuración existente.',
  })
  @ApiResponse({ status: 200, description: 'Configuración actualizada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o categoría inexistente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos (requiere ADMIN)' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateDisplayConfigDto) {
    return this.displayConfigsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Eliminar configuración de pantalla',
    description: 'Elimina permanentemente una configuración de pantalla.',
  })
  @ApiResponse({ status: 200, description: 'Configuración eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos (requiere ADMIN)' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.displayConfigsService.remove(id);
    return { message: 'Configuración eliminada exitosamente' };
  }
}
