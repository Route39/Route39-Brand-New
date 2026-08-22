import { registerEnumType } from "@nestjs/graphql";

export enum Gender {
    Male = "male",
    Female = "female",
    Other = "other",
    Unknown = "unknown"
}

registerEnumType(Gender, { name : 'Gender' });