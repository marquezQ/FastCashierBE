import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../products/entities/product.entity';
import { defaultProducts } from '../data/products.data';

@Injectable()
export class ProductsSeederProvider {
  private readonly logger = new Logger(ProductsSeederProvider.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting Products seeding...');

    for (const productData of defaultProducts) {
      const exists = await this.productRepository.findOne({
        where: { code: productData.code },
      });

      if (!exists) {
        const product = this.productRepository.create(productData);
        await this.productRepository.save(product);
        this.logger.debug(`Created product: ${productData.code}`);
      } else {
        // Logica heredada: si ya existe, actualizar con la categoría
        await this.productRepository.update(
          { code: productData.code },
          { idCategory: productData.idCategory },
        );
        this.logger.debug(
          `Updated category for existing product: ${productData.code}`,
        );
      }
    }

    this.logger.log('Products seeding completed.');
  }
}
