import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

enum ExportSortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}
registerEnumType(ExportSortDirection, { name: 'ExportSortDirection' });

@ObjectType('ExportResult')
export class ExportResultDTO {
  @Field(() => String)
  url: string;
}
enum ExportTable {
  ProviderWallet = 'ProviderWallet',
  DriverWallet = 'DriverWallet',
  RiderWallet = 'RiderWallet',
  FleetWallet = 'FleetWallet',
}
registerEnumType(ExportTable, { name: 'ExportTable' });

enum ExportType {
  CSV = 'csv',
}
registerEnumType(ExportType, { name: 'ExportType' });

@InputType('ExportSortArg')
export class ExportSortArg {
  @Field(() => String, { nullable: false })
  property: string;
  @Field(() => ExportSortDirection, { nullable: false })
  direction: ExportSortDirection;
}

@InputType('ExportArgs')
export class ExportArgsDTO {
  @Field(() => ExportTable, { nullable: false })
  table: ExportTable;
  @Field(() => [ExportFilterArg], { nullable: true })
  filters?: ExportFilterArg[];
  @Field(() => ExportSortArg, { nullable: true })
  sort?: ExportSortArg;
  @Field(() => [String], { nullable: true })
  relations?: string[];
  @Field(() => ExportType)
  type: ExportType;
}

@InputType('ExportFilterArg')
export class ExportFilterArg {
  @Field(() => String, { nullable: false })
  field: string;
  @Field(() => String, { nullable: false })
  value: string;
}
