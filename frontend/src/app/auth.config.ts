import type { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'http://localhost:8180/realms/research-platform',
  clientId: 'research-platform-frontend',
  redirectUri: `${window.location.origin}/experiments`,
  postLogoutRedirectUri: `${window.location.origin}/login`,
  responseType: 'code',
  scope: 'openid profile email',
};
