import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Launch documentation portal',
    minLength: 1,
  })
  name!: string;

  @ApiProperty({
    enum: ['planned', 'active', 'completed'],
    example: 'active',
  })
  status!: string;
}
