import { IsInt, Max, Min } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  ticketTypeId: number;

  @IsInt()
  @Min(1)
  @Max(20)
  numberOfTickets: number;
}
