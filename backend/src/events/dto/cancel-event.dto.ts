import { IsOptional, IsString } from 'class-validator';

export class CancelEventDto {
  // Προαιρετικό ενημερωτικό μήνυμα προς όλους όσους έχουν κάνει κράτηση.
  @IsOptional()
  @IsString()
  message?: string;
}
