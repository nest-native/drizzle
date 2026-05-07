import { Body, Controller, Get, Post } from '@nestjs/common';
import { MembersService } from './members.service';

interface CreateMemberBody {
  email: string;
  displayName: string;
}

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  list() {
    return this.membersService.list();
  }

  @Post()
  create(@Body() body: CreateMemberBody) {
    return this.membersService.create(body);
  }

  @Post('missing-email')
  triggerMissingEmail() {
    return this.membersService.triggerMissingEmail();
  }
}
