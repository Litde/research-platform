import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth.service';

interface Experiment {
  id?: string;
  name: string;
  description: string;
  createdAt?: string;
}

@Component({
  selector: 'app-experiments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './experiments.page.html',
  styleUrl: './experiments.page.css',
})
export class ExperimentsPage {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8080/api/experiments';

  readonly username = this.auth.username;
  readonly experiments = signal<Experiment[]>([]);
  readonly filteredExperiments = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    if (!query) return this.experiments();

    return this.experiments().filter((experiment) =>
      `${experiment.name} ${experiment.description}`
        .toLocaleLowerCase()
        .includes(query),
    );
  });
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly searchTerm = signal('');
  readonly showCreateForm = signal(false);

  name = '';
  description = '';

  constructor() {
    this.loadExperiments();
  }

  loadExperiments(): void {
    this.loading.set(true);
    this.error.set('');

    this.http.get<Experiment[]>(this.apiUrl).subscribe({
      next: (experiments) => {
        this.experiments.set(experiments);
        this.loading.set(false);
      },
      error: (error: { status: number }) => {
        console.error('Could not load experiments:', error);
        this.error.set(
          `We could not load your experiments (HTTP ${error.status}). Please try again.`,
        );
        this.loading.set(false);
      },
    });
  }

  createExperiment(): void {
    const name = this.name.trim();
    if (!name || this.saving()) return;

    this.saving.set(true);
    this.error.set('');

    this.http
      .post<Experiment>(this.apiUrl, {
        name,
        description: this.description.trim(),
      })
      .subscribe({
        next: (experiment) => {
          this.experiments.update((current) => [...current, experiment]);
          this.name = '';
          this.description = '';
          this.saving.set(false);
          this.showCreateForm.set(false);
        },
        error: (error: { status: number }) => {
          console.error('Could not create experiment:', error);
          this.error.set(
            `We could not save this experiment (HTTP ${error.status}). Please try again.`,
          );
          this.saving.set(false);
        },
      });
  }

  closeCreateForm(): void {
    if (this.saving()) return;
    this.showCreateForm.set(false);
    this.name = '';
    this.description = '';
  }

  logout(): void {
    this.auth.logout();
  }

  initials(): string {
    const value = this.username().trim();
    return value ? value.slice(0, 2).toLocaleUpperCase() : 'RP';
  }
}
