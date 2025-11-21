import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Verificar si el código ya existe
    const codeExists = await this.productRepository.findOne({
      where: { code: createProductDto.code },
    });

    if (codeExists) {
      throw new ConflictException('Product code already exists');
    }

    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async findAll(includeInactive = false): Promise<Product[]> {
    const whereCondition = includeInactive ? {} : { isActive: true };

    return await this.productRepository.find({
      where: whereCondition,
      order: { name: 'ASC' },
    });
  }

  async findActive(): Promise<Product[]> {
    return await this.productRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { idProduct: id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findByCode(code: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { code },
    });

    if (!product) {
      throw new NotFoundException(`Product with code ${code} not found`);
    }

    return product;
  }

  async search(query: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: [
        { name: Like(`%${query}%`), isActive: true },
        { code: Like(`%${query}%`), isActive: true },
        { description: Like(`%${query}%`), isActive: true },
      ],
      order: { name: 'ASC' },
    });
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Si se intenta actualizar el código, verificar que no exista
    if (updateProductDto.code && updateProductDto.code !== product.code) {
      const codeExists = await this.productRepository.findOne({
        where: { code: updateProductDto.code },
      });

      if (codeExists) {
        throw new ConflictException('Product code already exists');
      }
    }

    this.productRepository.merge(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  async toggleActive(id: number): Promise<Product> {
    const product = await this.findOne(id);
    product.isActive = !product.isActive;
    return await this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);

    // Verificar si tiene detalles de pedido asociados
    const hasOrders = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.orderDetails', 'orderDetail')
      .where('product.idProduct = :id', { id })
      .getCount();

    if (hasOrders > 0) {
      throw new BadRequestException(
        'Cannot delete product with associated orders. Consider deactivating it instead.',
      );
    }

    await this.productRepository.remove(product);
  }

  // Validar que un producto esté disponible para venta
  async validateProductForSale(productId: number): Promise<Product> {
    const product = await this.findOne(productId);

    if (!product.isActive) {
      throw new BadRequestException(
        `Product "${product.name}" is not available`,
      );
    }

    return product;
  }

  // Obtener múltiples productos por IDs (útil para Orders)
  async findByIds(ids: number[]): Promise<Product[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.idProduct IN (:...ids)', { ids })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .getMany();

    if (products.length !== ids.length) {
      throw new NotFoundException(
        'Some products were not found or are inactive',
      );
    }

    return products;
  }

  // Seed de productos por defecto
  async seedDefaultProducts(): Promise<void> {
    const defaultProducts = [
      {
        code: 'PROD-001',
        name: 'Hamburguesa Simple',
        description: 'Hamburguesa con carne, lechuga, tomate y queso',
        price: 25.5,
        imageUrl: undefined,
      },
      {
        code: 'PROD-002',
        name: 'Hamburguesa Doble',
        description: 'Hamburguesa con doble carne, lechuga, tomate y queso',
        price: 35.0,
        imageUrl: undefined,
      },
      {
        code: 'PROD-003',
        name: 'Papas Fritas',
        description: 'Porción de papas fritas crujientes',
        price: 12.0,
        imageUrl: undefined,
      },
      {
        code: 'PROD-004',
        name: 'Refresco',
        description: 'Bebida gaseosa 500ml',
        price: 8.0,
        imageUrl: undefined,
      },
      {
        code: 'PROD-005',
        name: 'Salchipapa',
        description: 'Papas fritas con salchicha',
        price: 18.0,
        imageUrl: undefined,
      },
    ];

    for (const productData of defaultProducts) {
      const exists = await this.productRepository.findOne({
        where: { code: productData.code },
      });

      if (!exists) {
        await this.create(productData);
      }
    }
  }
}
