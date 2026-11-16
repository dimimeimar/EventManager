// Η δομή του payload που υπάρχει μέσα στο access_token.
export interface JwtClaims {
  sub: number;
  username: string;
  roles: string[];
  exp: number;
}
