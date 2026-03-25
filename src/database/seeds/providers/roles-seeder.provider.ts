import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../roles/entities/role.entity';
import { defaultRoles } from '../data/roles.data';

@Injectable()
export class RolesSeederProvider {
  private readonly logger = new Logger(RolesSeederProvider.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting Roles seeding...');

    for (const roleData of defaultRoles) {
      const exists = await this.roleRepository.findOne({
        where: { roleName: roleData.roleName },
      });

      if (!exists) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
        this.logger.debug(`Created role: ${roleData.roleName}`);
      }
    }

    this.logger.log('Roles seeding completed.');
  }
}
