import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisplayConfigsService } from './display-configs.service';
import { DisplayConfigsController } from './display-configs.controller';
import { DisplayPublicController } from './display-public.controller';
import { DisplayConfig } from './entities/display-config.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DisplayConfig, Product, Category])],
  controllers: [DisplayConfigsController, DisplayPublicController],
  providers: [DisplayConfigsService],
  exports: [DisplayConfigsService],
})
export class DisplayConfigsModule {}
