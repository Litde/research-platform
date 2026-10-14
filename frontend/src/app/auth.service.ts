import { computed, Injectable, signal } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './auth.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(false);
  readonly username = signal('');
  readonly userId = signal('');
  readonly roles = signal<string[]>([]);
  readonly isAdmin = computed(() => this.roles().includes('admin'));
  readonly initializationError = signal('');

  constructor(private readonly oauthService: OAuthService) {}

  initialize(): Promise<void> {
    this.oauthService.configure(authConfig);
    this.oauthService.setStorage(sessionStorage);

    return this.oauthService
      .loadDiscoveryDocumentAndTryLogin()
      .then(() => {
        this.isAuthenticated.set(this.oauthService.hasValidAccessToken());

        const claims = this.oauthService.getIdentityClaims() as
          | {
              preferred_username?: string;
              sub?: string;
              realm_access?: { roles?: string[] };
            }
          | null;
        this.username.set(claims?.preferred_username ?? '');
        this.userId.set(claims?.sub ?? '');
        this.roles.set(claims?.realm_access?.roles ?? this.readAccessTokenRoles());

        if (this.isAuthenticated()) {
          this.oauthService.setupAutomaticSilentRefresh();
        }
      })
      .catch((error: unknown) => {
        console.error('Could not initialize Keycloak login:', error);
        this.initializationError.set(
          'We could not reach the sign-in service. Please make sure Keycloak is running and try again.',
        );
      });
  }

  login(): void {
    this.startLoginFlow();
  }

  register(): void {
    this.startLoginFlow('create');
  }

  private startLoginFlow(prompt?: string): void {
    const startFlow = () =>
      this.oauthService.initCodeFlow(
        undefined,
        prompt ? { prompt } : undefined,
      );

    if (this.initializationError()) {
      this.initialize().then(() => {
        if (!this.initializationError()) {
          startFlow();
        }
      });
      return;
    }

    startFlow();
  }

  logout(): void {
    this.oauthService.logOut();
  }

  private readAccessTokenRoles(): string[] {
    const accessToken = this.oauthService.getAccessToken();
    if (!accessToken) return [];

    const encodedPayload = accessToken.split('.')[1];
    if (!encodedPayload) return [];

    try {
      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
      const claims = JSON.parse(new TextDecoder().decode(bytes)) as {
        realm_access?: { roles?: string[] };
      };
      return claims.realm_access?.roles ?? [];
    } catch {
      return [];
    }
  }
}
