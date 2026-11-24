import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

// Παράμετροι αναζήτησης (query string). Όλα είναι προαιρετικά.
export class SearchEventsDto {
  @IsOptional() @IsString() text?: string; // ελεύθερο κείμενο: τίτλος ή περιγραφή
  @IsOptional() @IsString() location?: string; // πόλη, χώρα, διεύθυνση ή χώρος
  @IsOptional() @Type(() => Number) @IsInt() categoryId?: number;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize?: number;
}
