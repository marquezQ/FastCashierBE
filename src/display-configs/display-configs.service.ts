import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { DisplayConfig } from './entities/display-config.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateDisplayConfigDto, UpdateDisplayConfigDto } from './dto';

@Injectable()
export class DisplayConfigsService {
  constructor(
    @InjectRepository(DisplayConfig)
    private readonly displayConfigRepository: Repository<DisplayConfig>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Genera un código de acceso corto y único (6 caracteres alfanuméricos uppercase).
   * Ejemplo: "A3K9X2"
   */
  private generateAccessToken(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin 0/O, 1/I/L para evitar confusión
    let token = '';
    const bytes = randomBytes(6);
    for (let i = 0; i < 6; i++) {
      token += chars[bytes[i] % chars.length];
    }
    return token;
  }

  /**
   * Genera un token único verificando que no exista en la BD.
   */
  private async generateUniqueToken(): Promise<string> {
    let token: string;
    let exists: boolean;

    do {
      token = this.generateAccessToken();
      const existing = await this.displayConfigRepository.findOne({
        where: { accessToken: token },
      });
      exists = !!existing;
    } while (exists);

    return token;
  }

  /**
   * Valida que la categoría exista si se envía un categoryId.
   */
  private async validateCategory(categoryId: number | null | undefined): Promise<void> {
    if (categoryId === null || categoryId === undefined) return;

    const category = await this.categoryRepository.findOne({
      where: { idCategory: categoryId },
    });

    if (!category) {
      throw new BadRequestException(`La categoría con ID ${categoryId} no existe`);
    }
  }

  // ─── CRUD (Admin) ─────────────────────────────────────────────

  async create(dto: CreateDisplayConfigDto): Promise<DisplayConfig> {
    await this.validateCategory(dto.categoryId);

    const accessToken = await this.generateUniqueToken();

    const config = this.displayConfigRepository.create({
      ...dto,
      accessToken,
    });

    return await this.displayConfigRepository.save(config);
  }

  async findAll(): Promise<DisplayConfig[]> {
    return await this.displayConfigRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, dto: UpdateDisplayConfigDto): Promise<DisplayConfig> {
    const config = await this.displayConfigRepository.findOne({
      where: { idDisplayConfig: id },
    });

    if (!config) {
      throw new NotFoundException(`Configuración de pantalla con ID ${id} no encontrada`);
    }

    // Validar categoryId si se está actualizando
    if (dto.categoryId !== undefined) {
      await this.validateCategory(dto.categoryId);
    }

    this.displayConfigRepository.merge(config, dto);
    return await this.displayConfigRepository.save(config);
  }

  async remove(id: number): Promise<void> {
    const config = await this.displayConfigRepository.findOne({
      where: { idDisplayConfig: id },
    });

    if (!config) {
      throw new NotFoundException(`Configuración de pantalla con ID ${id} no encontrada`);
    }

    await this.displayConfigRepository.remove(config);
  }

  // ─── Endpoint Público (TV) ────────────────────────────────────

  async getDisplayData(token: string) {
    // 1. Buscar config activa por accessToken
    const config = await this.displayConfigRepository.findOne({
      where: { accessToken: token, isActive: true },
    });

    if (!config) {
      throw new NotFoundException('Pantalla no encontrada o inactiva');
    }

    // 2. Obtener productos según la categoría configurada
    let products: Product[];

    if (config.categoryId) {
      // Productos activos de la categoría específica
      products = await this.productRepository.find({
        where: { idCategory: config.categoryId, isActive: true },
        order: { name: 'ASC' },
      });
    } else {
      // Todos los productos activos
      products = await this.productRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    }

    // 3. Obtener nombre de la categoría
    let categoryName = 'Todo el Menú';
    if (config.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { idCategory: config.categoryId },
      });
      categoryName = category?.name || 'Menú';
    }

    // 4. Retornar solo los campos necesarios (sin exponer accessToken ni isActive)
    return {
      config: {
        idDisplayConfig: config.idDisplayConfig,
        name: config.name,
        rotationInterval: config.rotationInterval,
        transitionType: config.transitionType,
        showPrices: config.showPrices,
        showDescriptions: config.showDescriptions,
        productsPerSlide: config.productsPerSlide,
      },
      categoryName,
      products: products.map((p) => ({
        idProduct: p.idProduct,
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
      })),
    };
  }
}
