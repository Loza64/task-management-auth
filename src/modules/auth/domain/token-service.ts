export interface IssuedToken {
  token: string;
  expiresIn: number;
}

export interface TokenService {
  issue(userId: string): IssuedToken;
  verify(token: string): string;
}
