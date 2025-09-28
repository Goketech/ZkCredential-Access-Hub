export interface Credential {
  credentialId: string;
  issuer: string;
  user: string;
  commitment: string;
  type: string;
  issuedAt: number;
  expiry: number;
  revoked: boolean;
}
