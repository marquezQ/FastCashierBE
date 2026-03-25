import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../../categories/entities/category.entity';
import { defaultCategories } from '../data/categories.data';

@Injectable()
export class CategoriesSeederProvider {
  private readonly logger = new Logger(CategoriesSeederProvider.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting Categories seeding...');

    for (const categoryData of defaultCategories) {
      const exists = await this.categoryRepository.findOne({
        where: { name: categoryData.name },
      });

      if (!exists) {
        const category = this.categoryRepository.create(categoryData);
        await this.categoryRepository.save(category);
        this.logger.debug(`Created category: ${categoryData.name}`);
      }
    }

    this.logger.log('Categories seeding completed.');
  }
}
