import { Routes } from '@angular/router';
import { authenticatedGuard, loginPageGuard } from './auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginPageGuard],
    loadComponent: () =>
      import('./pages/login/login.page').then((module) => module.LoginPage),
  },
  {
    path: 'experiments',
    canActivate: [authenticatedGuard],
    loadComponent: () =>
      import('./pages/experiments/experiments.page').then(
        (module) => module.ExperimentsPage,
      ),
  },
  {
    path: 'explore',
    canActivate: [authenticatedGuard],
    loadComponent: () =>
      import('./pages/explore/explore.page').then((module) => module.ExplorePage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'experiments' },
  { path: '**', redirectTo: 'experiments' },
];
