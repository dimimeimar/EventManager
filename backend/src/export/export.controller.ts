import { BadRequestException, Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Εξαγωγή όλων των δεδομένων σε JSON ή XML, μόνο για τον διαχειριστή.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // GET /export?format=json  ή  GET /export?format=xml
  @Get()
  async export(@Query('format') format: string, @Res() res: Response) {
    if (format === 'json') {
      res.type('application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="eventmanager.json"');
      return res.send(await this.exportService.asJson());
    }
    if (format === 'xml') {
      res.type('application/xml');
      res.setHeader('Content-Disposition', 'attachment; filename="eventmanager.xml"');
      return res.send(await this.exportService.asXml());
    }
    throw new BadRequestException('Το format πρέπει να είναι json ή xml.');
  }
}
