import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateCustomerDto } from './create-customer.dto';
import {
  CustomersRepository,
  type Customer,
} from './customers.repository';

@Injectable()
export class CustomersService implements OnModuleInit {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async onModuleInit(): Promise<void> {
    await this.customersRepository.migrate();
  }

  list(): Promise<Customer[]> {
    return this.customersRepository.list();
  }

  create(input: CreateCustomerDto): Promise<Customer> {
    return this.customersRepository.create(input);
  }
}
