import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { AnnouncementDTO } from './dto/announcement.dto';
import { AnnouncementService } from './announcement.service';

@Resolver()
export class AnnouncementResolver {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Query(() => [AnnouncementDTO])
  async announcements(): Promise<AnnouncementDTO[]> {
    return this.announcementService.getAnnouncements();
  }

  @Query(() => AnnouncementDTO, { nullable: true })
  async announcement(
    @Args('id', { type: () => ID }) id: number,
  ): Promise<AnnouncementDTO | null> {
    return this.announcementService.getAnnouncementById(id);
  }
}
