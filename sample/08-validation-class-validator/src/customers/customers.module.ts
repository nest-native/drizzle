import { Module } from '@nestjs/common';
import { DrizzleModule } from 'nest-drizzle-native';
import { CustomersController } from './customers.controller';
import { CustomersRepository } from './customers.repository';
import { CustomersService } from './customers.service';

@Module({
  imports: [DrizzleModule.forFeature([CustomersRepository])],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
