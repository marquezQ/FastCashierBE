import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class TtsService implements OnModuleInit {
  private readonly logger = new Logger(TtsService.name);

  // Caché con tope: al llenarse, sale primero el menos usado recientemente
  private readonly cache = new Map<number, Buffer>();
  private readonly maxCache = Number(process.env.TTS_MAX_CACHE) || 1000;

  // Rango válido de números de pedido (evita que alguien llene el caché pidiendo números absurdos)
  private readonly maxPedido = Number(process.env.TTS_MAX_PEDIDO) || 9999;

  // Si Piper tarda más que esto, se mata el proceso
  private readonly timeoutMs = Number(process.env.TTS_TIMEOUT_MS) || 15000;

  // Peticiones en curso: dos peticiones del mismo número comparten una sola síntesis
  private readonly enCurso = new Map<number, Promise<Buffer>>();

  // Máximo de síntesis simultáneas en esta instancia; el resto espera su turno
  private readonly maxConcurrentes = Number(process.env.TTS_MAX_CONCURRENT) || 2;
  private activas = 0;
  private cola: Array<() => void> = [];

  private readonly piperBin: string;
  private readonly piperModel: string;
  private disponible = false;

  constructor() {
    this.piperBin = process.env.PIPER_BIN_PATH || `${process.env.HOME}/piper/piper/piper`;
    this.piperModel =
      process.env.PIPER_MODEL_PATH || `${process.env.HOME}/piper/models/es_MX-claude-high.onnx`;
  }

  onModuleInit() {
    // Si falta Piper NO se tumba todo el backend: la caja sigue funcionando
    // y solo el endpoint de voz responde 503.
    if (!fs.existsSync(this.piperBin)) {
      this.logger.error(`Piper binary no encontrado en: ${this.piperBin} (TTS desactivado)`);
      return;
    }
    if (!fs.existsSync(this.piperModel)) {
      this.logger.error(`Modelo Piper no encontrado en: ${this.piperModel} (TTS desactivado)`);
      return;
    }

    this.disponible = true;
    this.logger.log(`Piper TTS listo`);
    this.logger.log(`  Binario: ${this.piperBin}`);
    this.logger.log(`  Modelo:  ${this.piperModel}`);
    this.logger.log(
      `  Caché máx: ${this.maxCache} | Simultáneas: ${this.maxConcurrentes} | Pedido máx: ${this.maxPedido}`,
    );
  }

  async getAudioPedido(numeroPedido: number): Promise<Buffer> {
    if (!this.disponible) {
      throw new ServiceUnavailableException('El servicio de voz no está disponible');
    }
    if (!Number.isInteger(numeroPedido) || numeroPedido < 1 || numeroPedido > this.maxPedido) {
      throw new BadRequestException('Número de pedido inválido');
    }

    const cacheado = this.cache.get(numeroPedido);
    if (cacheado) {
      this.logger.debug(`Cache hit pedido #${numeroPedido}`);
      // Reinsertar para marcarlo como usado recientemente
      this.cache.delete(numeroPedido);
      this.cache.set(numeroPedido, cacheado);
      return cacheado;
    }

    let promesa = this.enCurso.get(numeroPedido);
    if (!promesa) {
      promesa = this.generarConLimite(numeroPedido)
        .then((buffer) => {
          this.guardarEnCache(numeroPedido, buffer);
          return buffer;
        })
        .finally(() => this.enCurso.delete(numeroPedido));
      this.enCurso.set(numeroPedido, promesa);
    }
    return promesa;
  }

  private guardarEnCache(numero: number, buffer: Buffer): void {
    if (this.cache.size >= this.maxCache) {
      const masAntiguo = this.cache.keys().next().value;
      if (masAntiguo !== undefined) this.cache.delete(masAntiguo);
    }
    this.cache.set(numero, buffer);
  }

  // ---- Límite de concurrencia (semáforo sencillo) ----

  private async generarConLimite(numero: number): Promise<Buffer> {
    await this.adquirir();
    try {
      return await this.generarAudio(numero);
    } finally {
      this.liberar();
    }
  }

  private adquirir(): Promise<void> {
    if (this.activas < this.maxConcurrentes) {
      this.activas++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => this.cola.push(resolve));
  }

  private liberar(): void {
    const siguiente = this.cola.shift();
    if (siguiente) {
      siguiente(); // el turno pasa directamente al siguiente en la cola
    } else {
      this.activas--;
    }
  }

  // ---- Síntesis con Piper ----

  private generarAudio(numero: number): Promise<Buffer> {
    const texto = this.buildTexto(numero);
    this.logger.debug(`Sintetizando con Piper: "${texto}"`);

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let stderrFinal = '';
      let terminado = false;
      let timer: NodeJS.Timeout | null = null;

      const terminar = (error?: Error, wav?: Buffer) => {
        if (terminado) return;
        terminado = true;
        if (timer) clearTimeout(timer);
        if (error) reject(error);
        else resolve(wav as Buffer);
      };

      // Piper recibe el texto por stdin y emite PCM crudo por stdout
      const piper = spawn(
        this.piperBin,
        ['--model', this.piperModel, '--output-raw', '--length_scale', '1.1', '--quiet'],
        {
          env: {
            ...process.env,
            // Las librerías compartidas están en la misma carpeta que el binario
            LD_LIBRARY_PATH: `${path.dirname(this.piperBin)}:${process.env.LD_LIBRARY_PATH || ''}`,
          },
        },
      );

      // Prioridad baja: ante un pico, nginx, PostgreSQL y las demás apps van primero
      if (piper.pid) {
        try {
          os.setPriority(piper.pid, 10);
        } catch {
          /* si no se puede, se ignora */
        }
      }

      timer = setTimeout(() => {
        timer = null;
        piper.kill('SIGKILL');
        terminar(new InternalServerErrorException(`Piper tardó más de ${this.timeoutMs} ms`));
      }, this.timeoutMs);

      piper.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));

      piper.stderr.on('data', (data: Buffer) => {
        // Guardamos solo el final del stderr, para incluirlo si hay un error
        stderrFinal = (stderrFinal + data.toString()).slice(-500);
      });

      // Sin este manejador, un EPIPE (Piper muere antes de leer el texto)
      // lanzaría una excepción no capturada y tumbaría el backend completo.
      piper.stdin.on('error', (err) => {
        this.logger.debug(`stdin de Piper: ${err.message}`);
      });

      piper.on('error', (err) => {
        this.logger.error(`Error al ejecutar Piper: ${err.message}`);
        terminar(new InternalServerErrorException(`Error ejecutando Piper: ${err.message}`));
      });

      piper.on('close', (code) => {
        if (code !== 0) {
          const msg = `Piper salió con código ${code}${stderrFinal ? `: ${stderrFinal.trim()}` : ''}`;
          this.logger.error(msg);
          return terminar(new InternalServerErrorException(msg));
        }

        const rawPcm = Buffer.concat(chunks);
        if (rawPcm.length === 0) {
          this.logger.error(`Piper no generó audio para el pedido #${numero}`);
          return terminar(new InternalServerErrorException('Piper no generó audio'));
        }

        // PCM 16-bit, 22050 Hz, mono -> le añadimos el header WAV para el navegador
        const wavBuffer = this.buildWavBuffer(rawPcm, 22050, 1, 16);
        this.logger.log(`Audio generado para pedido #${numero}: ${wavBuffer.length} bytes`);
        terminar(undefined, wavBuffer);
      });

      piper.stdin.end(texto);
    });
  }

  /**
   * Construye un Buffer WAV válido a partir de datos PCM raw.
   * Piper emite PCM 16-bit little-endian, sin header.
   */
  private buildWavBuffer(
    pcmData: Buffer,
    sampleRate: number,
    channels: number,
    bitDepth: number,
  ): Buffer {
    const byteRate = (sampleRate * channels * bitDepth) / 8;
    const blockAlign = (channels * bitDepth) / 8;
    const dataSize = pcmData.length;
    const headerSize = 44;

    const wav = Buffer.alloc(headerSize + dataSize);

    // RIFF chunk descriptor
    wav.write('RIFF', 0, 'ascii');
    wav.writeUInt32LE(36 + dataSize, 4);
    wav.write('WAVE', 8, 'ascii');

    // fmt sub-chunk
    wav.write('fmt ', 12, 'ascii');
    wav.writeUInt32LE(16, 16); // Subchunk1Size (16 para PCM)
    wav.writeUInt16LE(1, 20); // AudioFormat = PCM
    wav.writeUInt16LE(channels, 22);
    wav.writeUInt32LE(sampleRate, 24);
    wav.writeUInt32LE(byteRate, 28);
    wav.writeUInt16LE(blockAlign, 32);
    wav.writeUInt16LE(bitDepth, 34);

    // data sub-chunk
    wav.write('data', 36, 'ascii');
    wav.writeUInt32LE(dataSize, 40);
    pcmData.copy(wav, 44);

    return wav;
  }

  private buildTexto(numero: number): string {
    return `Pedido número, ${numero}`;
  }

  limpiarCache(): void {
    this.cache.clear();
    this.logger.log('Cache limpiado');
  }
}
