import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './auth.config';


interface Experiment {
  id?: string;
  name: string;
  description: string;
  createdAt?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly apiUrl = 'http://localhost:8080/api/experiments';

  experiments = signal<Experiment[]>([]);
  loading = signal(false);
  error = signal('');
  isAuthenticated = signal(false);
  username = signal('');
  name = '';
  description = '';
  showForm = false;

  constructor(
    private readonly http: HttpClient,
    private readonly oauthService: OAuthService,
  ) {}

  ngOnInit(): void {
    this.oauthService.configure(authConfig);
    this.oauthService.setStorage(sessionStorage);
    this.oauthService.loadDiscoveryDocumentAndTryLogin().then(() => {
      this.isAuthenticated.set(this.oauthService.hasValidAccessToken());
      if (this.isAuthenticated()) {
        this.oauthService.setupAutomaticSilentRefresh();
      }
      const claims = this.oauthService.getIdentityClaims() as
        | { preferred_username?: string }
        | null;
      this.username.set(claims?.preferred_username ?? '');

      if (this.isAuthenticated()) {
        this.loadExperiments();
      }
    }).catch((error: unknown) => {
      console.error('Could not initialize Keycloak login:', error);
      this.error.set('Could not connect to the login service. Is Keycloak running?');
    });
  }

  login(): void {
    this.oauthService.initCodeFlow();
  }

  logout(): void {
    this.oauthService.logOut();
  }

  loadExperiments(): void {
    this.loading.set(true);
    this.error.set('');

    this.http.get<Experiment[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.experiments.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading experiments:', err);
        this.error.set(
          `Could not load experiments. HTTP status: ${err.status}`
        );
        this.loading.set(false);
      },
    });
  }

  createExperiment(): void {
    const trimmedName = this.name.trim();

    if (!trimmedName) {
      this.error.set('Experiment name is required.');
      return;
    }

    const request = {
      name: trimmedName,
      description: this.description.trim(),
    };

    this.error.set('');

    this.http.post<Experiment>(this.apiUrl, request).subscribe({
      next: (created) => {
        this.experiments.update(current => [...current, created]);

        this.name = '';
        this.description = '';
        this.showForm = false;
      },
      error: (err) => {
        console.error('Error creating experiment:', err);

        this.error.set(
          `Could not create experiment. HTTP status: ${err.status}`
        );
      },
    });
  }


}
