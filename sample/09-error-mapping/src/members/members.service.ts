import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  MembersRepository,
  type Member,
} from './members.repository';

@Injectable()
export class MembersService implements OnModuleInit {
  constructor(private readonly membersRepository: MembersRepository) {}

  async onModuleInit(): Promise<void> {
    await this.membersRepository.migrate();
  }

  list(): Promise<Member[]> {
    return this.membersRepository.list();
  }

  create(input: {
    email: string;
    displayName: string;
  }): Promise<Member> {
    return this.membersRepository.create(input);
  }

  async triggerMissingEmail(): Promise<void> {
    await this.membersRepository.createWithMissingEmail();
  }
}
