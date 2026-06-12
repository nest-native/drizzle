import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import { MembersController } from './members.controller';
import { MembersRepository } from './members.repository';
import { MembersService } from './members.service';

@Module({
  imports: [DrizzleModule.forFeature([MembersRepository])],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
