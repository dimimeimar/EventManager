import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Οι φωτογραφίες αποθηκεύονται στον φάκελο uploads με τυχαίο όνομα.
const photoStorage = diskStorage({
  destination: 'uploads',
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${extname(file.originalname)}`),
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('categories')
  categories() {
    return this.eventsService.categories();
  }

  // Δημοσιευμένες εκδηλώσεις: για όλους τους συνδεδεμένους, και τον guest.
  @Get('events')
  findPublished() {
    return this.eventsService.findPublished();
  }

  @Roles('user')
  @Get('events/mine')
  findMine(@Req() req) {
    return this.eventsService.findMine(req.user);
  }

  @Get('events/:id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.eventsService.findOne(id, req.user);
  }

  @Roles('user')
  @Post('events')
  create(@Body() dto: CreateEventDto, @Req() req) {
    return this.eventsService.create(dto, req.user);
  }

  @Roles('user', 'admin')
  @Patch('events/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @Req() req,
  ) {
    return this.eventsService.update(id, dto, req.user);
  }

  @Roles('user', 'admin')
  @Patch('events/:id/publish')
  publish(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.eventsService.publish(id, req.user);
  }

  @Roles('user', 'admin')
  @Patch('events/:id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.eventsService.cancel(id, req.user);
  }

  @Roles('user', 'admin')
  @Delete('events/:id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.eventsService.remove(id, req.user);
  }

  @Roles('user', 'admin')
  @Post('events/:id/photos')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: photoStorage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        file.mimetype.startsWith('image/')
          ? cb(null, true)
          : cb(new BadRequestException('Επιτρέπονται μόνο εικόνες.'), false),
    }),
  )
  addPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    if (!file) throw new BadRequestException('Δεν στάλθηκε αρχείο.');
    return this.eventsService.addPhoto(id, file.filename, req.user);
  }

  @Roles('user', 'admin')
  @Delete('events/:id/photos/:photoId')
  removePhoto(
    @Param('id', ParseIntPipe) id: number,
    @Param('photoId', ParseIntPipe) photoId: number,
    @Req() req,
  ) {
    return this.eventsService.removePhoto(id, photoId, req.user);
  }
}
