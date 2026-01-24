import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) { }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Verificar si el nombre ya existe
    const nameExists = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (nameExists) {
      throw new ConflictException('Category name already exists');
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async findAll(includeInactive = false): Promise<Category[]> {
    const whereCondition = includeInactive ? {} : { isActive: true };

    return await this.categoryRepository.find({
      where: whereCondition,
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  async findAllWithProducts(): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { isActive: true },
      relations: ['products'],
      order: { order: 'ASC' },
    });
  }

  async findActive(): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { isActive: true },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  async findInactive(): Promise<Category[]> {
    return await this.categoryRepository.find({
      where: { isActive: false },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { idCategory: id },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    // Si se intenta actualizar el nombre, verificar que no exista
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const nameExists = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (nameExists) {
        throw new ConflictException('Category name already exists');
      }
    }

    this.categoryRepository.merge(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async toggleActive(id: number): Promise<Category> {
    const category = await this.findOne(id);
    category.isActive = !category.isActive;
    return await this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { idCategory: id },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Verificar si tiene productos asociados ACTIVOS
    const activeProducts = category.products?.filter((p) => p.isActive) || [];
    if (activeProducts.length > 0) {
      throw new BadRequestException(
        'Cannot deactivate category with active products. Please deactivate all products first.',
      );
    }

    // Soft delete: cambiar isActive a false
    category.isActive = false;
    await this.categoryRepository.save(category);
  }

  // Seed de categorías por defecto
  async seedDefaultCategories(): Promise<void> {
    const defaultCategories = [
      {
        name: 'COMIDA',
        description: 'Platos de comida y menús principales',
        order: 1,
      },
      {
        name: 'REFRESCOS',
        description: 'Bebidas frías y gaseosas',
        order: 2,
      },
      {
        name: 'BEBIDAS CALIENTES',
        description: 'Café, té y bebidas calientes',
        order: 3,
      },
      {
        name: 'POSTRES',
        description: 'Postres y dulces',
        order: 4,
      },
    ];

    for (const categoryData of defaultCategories) {
      const exists = await this.categoryRepository.findOne({
        where: { name: categoryData.name },
      });

      if (!exists) {
        await this.create(categoryData);
      }
    }
  }
}