import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DisplayConfigsService } from './display-configs.service';

@ApiTags('Display Público')
@Controller('display')
export class DisplayPublicController {
  constructor(private readonly displayConfigsService: DisplayConfigsService) {}

  @Get(':token')
  @ApiOperation({
    summary: 'Obtener datos de menú para la TV (público)',
    description:
      'Endpoint público sin autenticación. La TV accede directamente con su código de acceso para obtener los productos y la configuración de visualización.',
  })
  @ApiParam({
    name: 'token',
    description: 'Código de acceso de la pantalla (6 caracteres)',
    example: 'A3K9X2',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos de configuración y productos para la pantalla',
  })
  @ApiResponse({
    status: 404,
    description: 'Pantalla no encontrada o inactiva',
  })
  getDisplayData(@Param('token') token: string) {
    return this.displayConfigsService.getDisplayData(token);
  }
}
