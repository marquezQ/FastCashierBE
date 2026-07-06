import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../../users/entities/user.entity';
import { demoUsers, getProductionUsers } from '../data/users.data';

@Injectable()
export class UsersSeederProvider {
  private readonly logger = new Logger(UsersSeederProvider.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(seedMode: string): Promise<void> {
    this.logger.log(`Starting Users seeding... (mode: ${seedMode})`);

    // Selecciona el conjunto de usuarios según el modo de seed:
    // - 'demo'       → usuarios ficticios hardcodeados (admin, cajero, cocinero...)
    // - 'production' → solo 2 admins leídos del .env (desarrollador + dueño)
    const usersToSeed = seedMode === 'demo' ? demoUsers : getProductionUsers();

    for (const userData of usersToSeed) {
      const exists = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (!exists) {
        const passwordHash = await bcrypt.hash(userData.password, 10);

        const user = this.userRepository.create({
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone,
          roleId: userData.roleId,
          isActive: userData.isActive,
          passwordHash,
        });

        await this.userRepository.save(user);
        this.logger.debug(`Created user: ${userData.email}`);
      } else {
        this.logger.debug(`User already exists, skipping: ${userData.email}`);
      }
    }

    this.logger.log('Users seeding completed.');
  }
}
