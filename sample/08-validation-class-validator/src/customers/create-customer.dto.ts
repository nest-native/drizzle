import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  displayName!: string;

  @IsEnum(['free', 'team', 'enterprise'])
  plan!: 'free' | 'team' | 'enterprise';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(250)
  seats!: number;
}
