import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class TicketTypeDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateEventDto {
  @IsString() @MinLength(3) title: string;
  @IsString() @MinLength(1) eventType: string;
  @IsString() @MinLength(1) venue: string;
  @IsString() @MinLength(1) address: string;
  @IsString() @MinLength(1) city: string;
  @IsString() @MinLength(1) country: string;

  @IsOptional() @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) longitude?: number;

  @IsDateString() startDateTime: string;
  @IsDateString() endDateTime: string;

  @IsInt() @Min(1) capacity: number;
  @IsString() description: string;

  @IsArray()
  @ArrayMinSize(1) // το DTD απαιτεί τουλάχιστον μία κατηγορία (Category+)
  @IsInt({ each: true })
  categoryIds: number[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TicketTypeDto)
  ticketTypes: TicketTypeDto[];
}
