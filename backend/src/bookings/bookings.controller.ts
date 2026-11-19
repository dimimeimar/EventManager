import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Roles('user')
  @Post('bookings')
  create(@Body() dto: CreateBookingDto, @Req() req) {
    return this.bookingsService.create(dto, req.user);
  }

  @Roles('user')
  @Get('bookings/mine')
  findMine(@Req() req) {
    return this.bookingsService.findMine(req.user);
  }

  @Roles('user')
  @Patch('bookings/:id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.bookingsService.cancel(id, req.user);
  }

  @Roles('user', 'admin')
  @Get('events/:id/bookings')
  findForEvent(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.bookingsService.findForEvent(id, req.user);
  }
}
