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

@ObjectType('DriverNote')
@BeforeCreateOne(
  (input: CreateOneInputType<DriverNoteDTO>, context: UserContext) => {
    return { input: { ...input.input, staffId: context.req.user.id } };
  },
)
@Relation('staff', () => OperatorDTO)
export class DriverNoteDTO {
  @IDField(() => ID)
  id!: number;

  @Field()
  createdAt!: Date;

  @FilterableField(() => ID, { filterRequired: true })
  driverId!: number;

  @Field()
  note!: string;
}
