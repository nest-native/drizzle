import { ApiProperty } from '@nestjs/swagger';

export class ProjectDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Launch documentation portal' })
  name!: string;

  @ApiProperty({
    enum: ['planned', 'active', 'completed'],
    example: 'active',
  })
  status!: string;

  @ApiProperty({ example: '2026-01-10T10:00:00.000Z' })
  createdAt!: string;
}
