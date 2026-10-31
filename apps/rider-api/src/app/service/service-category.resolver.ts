import { Args, Float, Query, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceCategoryEntity } from '@ridy/database';
import { Repository } from 'typeorm';
import { ServiceCategoryDTO } from './dto/service-category.dto';

@Resolver()
export class ServiceCategoryResolver {
  constructor(
    @InjectRepository(ServiceCategoryEntity)
    private categoryRepository: Repository<ServiceCategoryEntity>,
  ) {}

  @Query(() => [ServiceCategoryDTO])
  async serviceCategories(
    @Args('lat', { type: () => Float, nullable: true }) lat?: number,
    @Args('lng', { type: () => Float, nullable: true }) lng?: number,
  ): Promise<ServiceCategoryDTO[]> {
    const cats = await this.categoryRepository.find({
      where: { isEnabled: true },
      relations: { media: true, services: { media: true, regions: true } },
      order: { displayPriority: 'ASC', id: 'ASC' },
    });
    let regionId: number | null = null;
    if (typeof lat === 'number' && typeof lng === 'number') {
      const region = await this.categoryRepository.query(
        `SELECT id FROM region WHERE enabled=TRUE AND ST_Within(st_geomfromtext('POINT(? ?)'), location) ORDER BY ST_Area(location) ASC LIMIT 1`,
        [lng, lat],
      );
      if (region.length > 0) regionId = Number(region[0].id);
    }
    const out = cats.map((c) => {
      const services = (c.services ?? [])
        .filter((s) => s.deletedAt == null)
        .filter((s) => regionId === null || (s.regions ?? []).some((r) => Number(r.id) === regionId))
        .sort((a, b) => ((a as any).displayPriority ?? 0) - ((b as any).displayPriority ?? 0) || a.id - b.id)
        .map((s) => ({ ...s, name: (s as any).name ?? (s as any).title, options: [] }));
      return { ...c, services } as unknown as ServiceCategoryDTO;
    });
    return regionId === null ? out : out.filter((c) => c.services.length > 0);
  }
}
