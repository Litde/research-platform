import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

const apiUrl = 'http://localhost:8080/api';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const oauthService = inject(OAuthService);

  if (!request.url.startsWith(apiUrl) || !oauthService.hasValidAccessToken()) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${oauthService.getAccessToken()}` },
    }),
  );
};
