import { Controller, Get, Delete, Param, Res, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { TtsService } from './tts.service';

@ApiTags('TTS')
@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @Get('pedido/:numero')
  @ApiOperation({
    summary: 'Generar audio MP3 para un número de pedido',
    description:
      'Genera un audio MP3 con voz femenina (es-MX-DaliaNeural) anunciando el número de pedido. El resultado se cachea en memoria.',
  })
  @ApiParam({
    name: 'numero',
    description: 'Número de pedido (entero entre 1 y 9999)',
    example: 45,
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo MP3 con el audio del pedido',
    content: { 'audio/mpeg': {} },
  })
  @ApiResponse({ status: 400, description: 'Número de pedido inválido' })
  @ApiResponse({ status: 500, description: 'Error generando el audio' })
  async getAudioPedido(@Param('numero') numero: string, @Res() res: Response): Promise<void> {
    const n = Number(numero);

    if (!Number.isInteger(n) || n < 1 || n > 9999) {
      throw new BadRequestException('El número de pedido debe ser un entero entre 1 y 9999');
    }

    const buffer = await this.ttsService.getAudioPedido(n);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
    });

    res.end(buffer);
  }

  @Delete('cache')
  @ApiOperation({
    summary: 'Limpiar caché de audios TTS',
    description: 'Elimina todos los audios almacenados en caché de memoria.',
  })
  @ApiResponse({ status: 200, description: 'Cache limpiado correctamente' })
  limpiarCache(): { message: string } {
    this.ttsService.limpiarCache();
    return { message: 'Cache limpiado correctamente' };
  }
}
