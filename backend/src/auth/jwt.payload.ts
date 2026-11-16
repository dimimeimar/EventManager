// Το περιεχόμενο (payload) που μπαίνει μέσα στο JWT.
export interface JwtPayload {
  sub: number;
  username: string;
  roles: string[];
}
