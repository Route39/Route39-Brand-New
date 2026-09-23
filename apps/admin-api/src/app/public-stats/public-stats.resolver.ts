import { Query, Resolver } from '@nestjs/graphql';
import { PublicStatsService } from './public-stats.service';
import { PublicLiveStatsDTO } from './dtos/public-live-stats.dto';

@Resolver()
export class PublicStatsResolver {
  constructor(private publicStatsService: PublicStatsService) {}

  @Query(() => PublicLiveStatsDTO)
  async publicLiveStats(): Promise<PublicLiveStatsDTO> {
    return this.publicStatsService.getLiveStats();
  }
}
