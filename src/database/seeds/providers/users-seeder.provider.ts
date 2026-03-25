import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../../users/entities/user.entity';
import { defaultUsers } from '../data/users.data';

@Injectable()
export class UsersSeederProvider {
  private readonly logger = new Logger(UsersSeederProvider.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting Users seeding...');

    for (const userData of defaultUsers) {
      const exists = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (!exists) {
        // Hashear password al vuelo
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
      }
    }

    this.logger.log('Users seeding completed.');
  }
}
