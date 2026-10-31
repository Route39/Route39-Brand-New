import {
  Authorize,
  IDField,
  PagingStrategies,
  Relation,
  UnPagedRelation,
} from '@ptc-org/nestjs-query-graphql';
import { ID, Int, ObjectType, Field } from '@nestjs/graphql';
import { ServiceAuthorizer } from './service.authorizer';
import { ServiceDTO } from './service.dto';
import { MediaDTO } from '../../upload/media.dto';

@ObjectType('ServiceCategory')
@UnPagedRelation('services', () => ServiceDTO, {
  pagingStrategy: PagingStrategies.NONE,
})
@Relation('media', () => MediaDTO, { nullable: true })
@Authorize(ServiceAuthorizer)
export class ServiceCategoryDTO {
  @IDField(() => ID)
  id!: number;
  @Field(() => String, { nullable: false })
  name!: string;
  @Field(() => String, { nullable: true })
  description?: string;
  @Field(() => Int)
  displayPriority!: number;
  @Field(() => Boolean)
  isEnabled!: boolean;
  @Field(() => ID, { nullable: true })
  mediaId?: number;
}
