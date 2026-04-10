import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';

@Injectable()
export class TtsService implements OnModuleInit {
  private readonly logger = new Logger(TtsService.name);
  private readonly cache = new Map<number, Buffer>();
  private readonly voz = 'es-MX-DaliaNeural';

  // La instancia de msedge-tts se carga dinámicamente (ESM puro)
  private MsEdgeTTS: any;
  private OUTPUT_FORMAT: any;

  async onModuleInit() {
    // Dynamic import — única forma de usar ESM desde NestJS CommonJS
    const mod = await import('msedge-tts');
    this.MsEdgeTTS = mod.MsEdgeTTS;
    this.OUTPUT_FORMAT = mod.OUTPUT_FORMAT;
    this.logger.log('msedge-tts cargado correctamente');
  }

  async getAudioPedido(numeroPedido: number): Promise<Buffer> {
    if (this.cache.has(numeroPedido)) {
      this.logger.debug(`Cache hit pedido #${numeroPedido}`);
      return this.cache.get(numeroPedido)!;
    }

    const buffer = await this.generarAudio(numeroPedido);
    this.cache.set(numeroPedido, buffer);
    return buffer;
  }

  private async generarAudio(numero: number): Promise<Buffer> {
    try {
      const texto = this.buildTexto(numero);
      this.logger.debug(`Texto a sintetizar: "${texto}"`);

      const tts = new this.MsEdgeTTS();
      await tts.setMetadata(
        this.voz,
        this.OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
      );

      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];

        // toStream usa el template SSML interno de la librería (funciona correctamente)
        // rawToStream con SSML personalizado causa desconexión silenciosa de Microsoft
        const { audioStream } = tts.toStream(texto);

        audioStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        audioStream.on('end', () => {
          const total = Buffer.concat(chunks);
          this.logger.log(`Audio generado para pedido #${numero}: ${total.length} bytes`);
          tts.close();
          resolve(total);
        });

        audioStream.on('error', (err: Error) => {
          this.logger.error(`Error en stream de audio: ${err.message}`);
          tts.close();
          reject(err);
        });
      });
    } catch (error) {
      this.logger.error(
        `Error generando audio para pedido #${numero}`,
        error,
      );
      throw new InternalServerErrorException('No se pudo generar el audio');
    }
  }

  /**
   * Construye el texto para el anuncio del pedido.
   * Se usa texto plano porque rawToStream con SSML personalizado
   * causa desconexión silenciosa del servidor de Microsoft.
   */
  private buildTexto(numero: number): string {
    return `Pedido número ${numero}, por favor`;
  }

  limpiarCache(): void {
    this.cache.clear();
    this.logger.log('Cache limpiado');
  }
}
