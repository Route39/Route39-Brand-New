import { ID, ObjectType, Field, GraphQLISODateTime } from '@nestjs/graphql';
import {
  BeforeCreateOne,
  CreateOneInputType,
  FilterableField,
  IDField,
  Relation,
} from '@ptc-org/nestjs-query-graphql';
import { CustomerDTO } from './customer.dto';
import { OperatorDTO } from '../../operator/dto/operator.dto';
import { UserContext } from '../../auth/authenticated-admin';

@ObjectType('CustomerNote')
@Relation('customer', () => CustomerDTO)
@Relation('createdBy', () => OperatorDTO)
@BeforeCreateOne(
  (input: CreateOneInputType<CustomerNoteDTO>, context: UserContext) => {
    return { input: { ...input.input, createdById: context.req.user.id } };
  },
)
export class CustomerNoteDTO {
  @IDField(() => ID)
  id: string;
  @Field(() => GraphQLISODateTime, { nullable: false })
  createdAt!: Date;
  @FilterableField(() => ID, { filterRequired: true })
  customerId!: number;
  @Field(() => String, { nullable: false })
  note!: string;
  @Field(() => ID)
  createdById!: number;
}
