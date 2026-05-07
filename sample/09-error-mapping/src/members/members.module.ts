import { Module } from '@nestjs/common';
import { DrizzleModule } from 'nest-drizzle-native';
import { MembersController } from './members.controller';
import { MembersRepository } from './members.repository';
import { MembersService } from './members.service';

@Module({
  imports: [DrizzleModule.forFeature([MembersRepository])],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
