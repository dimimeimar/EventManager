import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RecommenderController } from './recommender.controller';
import { RecommenderService } from './recommender.service';

@Module({
  imports: [PrismaModule],
  controllers: [RecommenderController],
  providers: [RecommenderService],
})
export class RecommenderModule {}
