export interface HttpExchange {
  request: {
    url: string;
    method: string;
    headers: unknown;
    body: unknown;
  };
  reply: {
    http_code: number;
    headers: unknown;
    body: unknown;
  };
}

export interface AuthStatus {
  isAuthenticated: boolean;
  tokens: unknown;
  kcIdpHint: string | null;
  validatedIdp: string | null;
}
