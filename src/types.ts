export enum SslMode {
  Disable = "disable",
  Allow = "allow",
  Prefer = "prefer",
  Require = "require",
  VerifyCa = "verify-ca",
  VerifyFull = "verify-full",
}

export enum AccessMode {
  Ro = "ro",
  Rw = "rw",
}

export interface Profile {
  name: string;
  host: string;
  port: number;
  user: string;
  database: string;
  ssl_mode: SslMode;
  access_mode: AccessMode;
}
