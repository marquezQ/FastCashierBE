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
import { Category } from '../categories/entities/category.entity';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) { }

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

  async findInactive(): Promise<Product[]> {
    return await this.productRepository.find({
      where: { isActive: false },
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
    const orderDetailsCount = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.orderDetails', 'orderDetail')
      .where('product.idProduct = :id', { id })
      .andWhere('orderDetail.idDetail IS NOT NULL')
      .getCount();

    if (orderDetailsCount > 0) {
      throw new BadRequestException(
        'Cannot deactivate product with order history. Product will be marked as inactive.',
      );
    }

    // Soft delete: cambiar isActive a false
    product.isActive = false;
    await this.productRepository.save(product);
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
  // Buscar productos por categoría
  async findByCategory(categoryId: number): Promise<Product[]> {
    return await this.productRepository.find({
      where: {
        idCategory: categoryId,
        isActive: true,
      },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  // Buscar todos los productos con su categoría
  async findAllWithCategory(): Promise<Product[]> {
    return await this.productRepository.find({
      where: { isActive: true },
      relations: ['category'],
      order: {
        name: 'ASC',
      },
    });
  }
  async findGroupedByCategory(): Promise<any> {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      relations: ['products'],
      order: { order: 'ASC' },
    });

    return categories.map((category) => ({
      idCategory: category.idCategory,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      order: category.order,
      productCount: category.products.filter((p) => p.isActive).length,
      products: category.products
        .filter((p) => p.isActive)
        .map((p) => ({
          idProduct: p.idProduct,
          code: p.code,
          name: p.name,
          description: p.description,
          price: p.price,
          imageUrl: p.imageUrl,
          isActive: p.isActive,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
    }));
  }

  // Seed de productos por defecto con categorías
  async seedDefaultProducts(): Promise<void> {
    const defaultProducts = [
      {
        code: 'PROD-001',
        name: 'Broaster 1 presa',
        description: 'Arroz, papa frita, platano frito y una presa de broaster',
        price: 20.0,
        imageUrl: undefined,
        idCategory: 1, // COMIDA
      },
      {
        code: 'PROD-002',
        name: 'Broaster 2 presas',
        description:
          'Arroz, papa frita, platano frito y dos presas de broaster',
        price: 32.0,
        imageUrl: undefined,
        idCategory: 1, // COMIDA
      },
      {
        code: 'PROD-003',
        name: 'Papas Fritas',
        description: 'Porción de papas fritas crujientes',
        price: 10.0,
        imageUrl: undefined,
        idCategory: 1, // COMIDA
      },
      {
        code: 'PROD-004',
        name: 'Gaseosa 2L',
        description: 'Bebida gaseosa 2 Litros',
        price: 15.0,
        imageUrl: undefined,
        idCategory: 2, // REFRESCOS
      },
      {
        code: 'PROD-005',
        name: 'Refresco Natural 2L',
        description: 'Hervido tostada',
        price: 15.0,
        imageUrl: undefined,
        idCategory: 2, // REFRESCOS
      },
    ];

    for (const productData of defaultProducts) {
      const exists = await this.productRepository.findOne({
        where: { code: productData.code },
      });

      if (!exists) {
        // Si no existe, crear nuevo producto
        await this.create(productData);
      } else {
        // SI YA EXISTE, actualizar con la categoría
        console.log(` Product ${productData.code} already exists, updating category...`);

        // Actualizar el producto existente
        await this.productRepository.update(
          { code: productData.code },
          { idCategory: productData.idCategory }
        );
      }
    }
  }
}
