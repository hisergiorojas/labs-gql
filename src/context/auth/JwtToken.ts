export enum AuthRole {
  ADMIN = 'a',
  MANAGER = 'mm',
  REVIEWER = 'r',
  STUDENT = 's',
  MENTOR = 'm',
  APPLICANT_MENTOR = 'am',
  APPLICANT_STUDENT = 'as',
  PARTNER = 'p',
  UNSPECIFIED = '_',
}

export enum AuthByTarget {
  ID = 'i',
  USERNAME = 'u',
}

export interface JwtToken {
  typ: AuthRole
  evt: string
  sid?: string
  tgt?: AuthByTarget
  pc?: string
}
