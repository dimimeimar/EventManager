import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Τα μηνύματα είναι για εγγεγραμμένους χρήστες και τον admin, όχι για τον επισκέπτη.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('user', 'admin')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  send(@Body() dto: CreateMessageDto, @Req() req) {
    return this.messagesService.send(dto, req.user);
  }

  @Get('inbox')
  inbox(@Req() req) {
    return this.messagesService.inbox(req.user);
  }

  @Get('sent')
  sent(@Req() req) {
    return this.messagesService.sent(req.user);
  }

  @Get('unread-count')
  unreadCount(@Req() req) {
    return this.messagesService.unreadCount(req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.messagesService.findOne(id, req.user);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.messagesService.remove(id, req.user);
  }
}
