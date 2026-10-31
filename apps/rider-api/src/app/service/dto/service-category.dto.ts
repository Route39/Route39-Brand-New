import { ID, Int, ObjectType, Field } from '@nestjs/graphql';
import { MediaDTO } from '../../upload/media.dto';
import { ServiceDTO } from './service.dto';

@ObjectType('ServiceCategory')
export class ServiceCategoryDTO {
  @Field(() => ID)
  id!: number;
  @Field(() => String, { nullable: false })
  name!: string;
  @Field(() => String, { nullable: true })
  description?: string;
  @Field(() => Int, { nullable: false })
  displayPriority!: number;
  @Field(() => MediaDTO, { nullable: true })
  media?: MediaDTO;
  @Field(() => [ServiceDTO], { nullable: false })
  services!: ServiceDTO[];
}
