import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  BeforeCreateOne,
  CreateOneInputType,
  FilterableField,
  IDField,
  Relation,
} from '@ptc-org/nestjs-query-graphql';
import { OperatorDTO } from '../../operator/dto/operator.dto';
import { UserContext } from '../../auth/authenticated-admin';

@ObjectType('TaxiOrderNote')
@Relation('staff', () => OperatorDTO)
@BeforeCreateOne(
  (input: CreateOneInputType<TaxiOrderNoteDTO>, context: UserContext) => {
    return { input: { ...input.input, staffId: context.req.user.id } };
  },
)
export class TaxiOrderNoteDTO {
  @IDField(() => ID)
  id!: number;

  @Field()
  createdAt!: Date;

  @FilterableField(() => ID, { filterRequired: true })
  orderId!: number;

  @Field()
  note!: string;
}
