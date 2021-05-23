import { InputType, Field } from 'type-graphql';
import { Prisma } from '@prisma/client';
import { StudentStatus } from '../enums';

@InputType()
export class StudentFilterInput {
  @Field(() => StudentStatus, { nullable: true })
  inStatus?: StudentStatus

  @Field(() => Boolean, { nullable: true })
  withProjects?: boolean

  toQuery(): Prisma.StudentWhereInput {
    return {
      status: this.inStatus,
      projects: this.withProjects ? { some: {} } : undefined,
    };
  }
}
