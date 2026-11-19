import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { BookingsModule } from './bookings/bookings.module';
import { MessagesModule } from './messages/messages.module';
import { ExportModule } from './export/export.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, EventsModule, BookingsModule, MessagesModule, ExportModule],
})
export class AppModule {}
