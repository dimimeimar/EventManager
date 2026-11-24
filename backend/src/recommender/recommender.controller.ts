import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RecommenderService } from './recommender.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recommendations')
export class RecommenderController {
  constructor(private readonly recommender: RecommenderService) {}

  // Προτάσεις για τον συνδεδεμένο χρήστη
  @Roles('user')
  @Get()
  mine(@Req() req) {
    return this.recommender.recommend(req.user.userId, 5);
  }

  // Μετρικές αξιολόγησης (RMSE, MAE, Precision@K, Recall@K)
  @Roles('admin')
  @Get('evaluation')
  evaluation(@Query('folds') folds?: string, @Query('k') k?: string) {
    return this.recommender.evaluate(Number(folds) || 5, Number(k) || 5);
  }

  @Roles('admin')
  @Post('retrain')
  retrain() {
    return this.recommender.retrain();
  }
}
