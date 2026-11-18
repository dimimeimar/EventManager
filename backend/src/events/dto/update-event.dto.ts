import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';

// Στην ενημέρωση όλα τα πεδία είναι προαιρετικά.
export class UpdateEventDto extends PartialType(CreateEventDto) {}
