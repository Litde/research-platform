import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth.service';

interface Experiment {
  id?: string;
  name: string;
  description: string;
  createdAt?: string;
  ownerId?: string;
  publiclyVisible: boolean;
  publiclyEditable: boolean;
  type?: string;
  metrics?: { key: string; label: string; unit: string; chartType: string }[];
  chartMetricKey?: string;
}

interface ExperimentRun {
  id: string;
  experimentId: string;
  experimentName: string;
  calculation: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  samples: number;
  estimate: number | null;
  metricValues?: Record<string, number>;
  durationMillis: number;
  createdAt: string;
  error?: string;
}

@Component({
  selector: 'app-experiments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './experiments.page.html',
  styleUrl: './experiments.page.css',
})
export class ExperimentsPage implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = 'http://localhost:8080/api/experiments';

  readonly username = this.auth.username;
  readonly isAdmin = this.auth.isAdmin;
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
  readonly editingExperiment = signal<Experiment | null>(null);
  readonly activeExperimentId = signal<string | null>(null);
  readonly runs = signal<ExperimentRun[]>([]);
  readonly runSamples = signal(100_000_000);
  readonly queueingRun = signal(false);
  readonly runError = signal('');
  readonly activeRuns = signal<ExperimentRun[]>([]);
  readonly showQueuePanel = signal(false);
  private runPollingTimer?: ReturnType<typeof setInterval>;
  private activeRunsTimer?: ReturnType<typeof setInterval>;

  name = '';
  description = '';
  publiclyVisible = false;
  publiclyEditable = false;
  chartMetricKey = 'estimate';
  readonly metricOptions = [
    { key: 'estimate', label: 'Pi estimate', unit: '' },
    { key: 'durationMillis', label: 'Compute time', unit: 'ms' },
    { key: 'samples', label: 'Number of samples', unit: 'count' },
  ];

  constructor() {
    this.loadExperiments();
    this.loadActiveRuns();
    this.activeRunsTimer = setInterval(() => this.loadActiveRuns(), 2000);
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

    const request = {
      name,
      description: this.description.trim(),
      publiclyVisible: this.publiclyVisible,
      publiclyEditable: this.publiclyEditable && this.publiclyVisible,
      chartMetricKey: this.chartMetricKey,
    };
    const editing = this.editingExperiment();
    const saveRequest = editing?.id
      ? this.http.put<Experiment>(`${this.apiUrl}/${editing.id}`, request)
      : this.http.post<Experiment>(this.apiUrl, request);

    saveRequest
      .subscribe({
        next: (experiment: Experiment) => {
          this.experiments.update((current) => editing?.id
            ? current.map((item) => item.id === experiment.id ? experiment : item)
            : [...current, experiment]);
          this.name = '';
          this.description = '';
          this.publiclyVisible = false;
          this.publiclyEditable = false;
          this.chartMetricKey = 'estimate';
          this.saving.set(false);
          this.showCreateForm.set(false);
          this.editingExperiment.set(null);
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
    this.publiclyVisible = false;
    this.publiclyEditable = false;
    this.chartMetricKey = 'estimate';
    this.editingExperiment.set(null);
  }

  openCreateForm(): void {
    this.editingExperiment.set(null);
    this.name = '';
    this.description = '';
    this.publiclyVisible = false;
    this.publiclyEditable = false;
    this.chartMetricKey = 'estimate';
    this.showCreateForm.set(true);
  }

  editExperiment(experiment: Experiment): void {
    this.editingExperiment.set(experiment);
    this.name = experiment.name;
    this.description = experiment.description ?? '';
    this.publiclyVisible = experiment.publiclyVisible;
    this.publiclyEditable = experiment.publiclyEditable;
    this.chartMetricKey = experiment.chartMetricKey ?? 'estimate';
    this.showCreateForm.set(true);
  }

  canEditExperiment(experiment: Experiment): boolean {
    return this.isAdmin()
      || experiment.ownerId === this.auth.userId()
      || (experiment.publiclyVisible && experiment.publiclyEditable);
  }

  canEditSettings(experiment: Experiment | null): boolean {
    return this.isAdmin() || !experiment || experiment.ownerId === this.auth.userId();
  }

  onPublicVisibilityChange(isPublic: boolean): void {
    this.publiclyVisible = isPublic;
    if (!isPublic) this.publiclyEditable = false;
  }

  deleteExperiment(experiment: Experiment): void {
    if (!this.isAdmin() || !experiment.id) return;
    if (!window.confirm(`Delete "${experiment.name}" and its simulation history?`)) return;
    this.http.delete<void>(`${this.apiUrl}/${experiment.id}`).subscribe({
      next: () => {
        this.experiments.update((items) => items.filter((item) => item.id !== experiment.id));
        if (this.activeExperimentId() === experiment.id) this.closeRuns();
      },
      error: (error: { status: number }) => this.error.set(`Could not delete experiment (HTTP ${error.status}).`),
    });
  }

  openRuns(experiment: Experiment): void {
    if (!experiment.id) return;
    this.stopRunPolling();
    this.activeExperimentId.set(experiment.id);
    this.runError.set('');
    this.loadRuns(experiment.id);
  }

  openExperimentFromQueue(run: ExperimentRun): void {
    const experiment = this.experiments().find((item) => item.id === run.experimentId);
    if (experiment) {
      this.openRuns(experiment);
      this.showQueuePanel.set(false);
    }
  }

  loadRuns(experimentId: string): void {
    this.http.get<ExperimentRun[]>(`${this.apiUrl}/${experimentId}/runs`).subscribe({
      next: (runs) => {
        if (this.activeExperimentId() !== experimentId) return;
        this.runs.set(runs);
        if (runs.some((run) => run.status === 'QUEUED' || run.status === 'RUNNING')) {
          this.startRunPolling(experimentId);
        } else {
          this.stopRunPolling();
        }
      },
      error: (error: { status: number }) => {
        this.runError.set(`Could not load simulation history (HTTP ${error.status}).`);
      },
    });
  }

  startSimulation(experimentId: string): void {
    if (this.queueingRun()) return;
    this.queueingRun.set(true);
    this.runError.set('');
    this.http.post<ExperimentRun>(`${this.apiUrl}/${experimentId}/runs`, {
      samples: this.runSamples(),
    }).subscribe({
      next: (run) => {
        this.runs.update((current) => [run, ...current]);
        this.queueingRun.set(false);
        this.startRunPolling(experimentId);
      },
      error: (error: { status: number }) => {
        this.runError.set(`Could not queue the simulation (HTTP ${error.status}). Check that RabbitMQ is running.`);
        this.queueingRun.set(false);
      },
    });
  }

  private startRunPolling(experimentId: string): void {
    if (this.runPollingTimer) return;
    this.runPollingTimer = setInterval(() => this.loadRuns(experimentId), 1500);
  }

  private stopRunPolling(): void {
    if (this.runPollingTimer) clearInterval(this.runPollingTimer);
    this.runPollingTimer = undefined;
  }

  loadActiveRuns(): void {
    this.http.get<ExperimentRun[]>('http://localhost:8080/api/experiment-runs/active').subscribe({
      next: (runs) => this.activeRuns.set(runs),
      error: (error: { status: number }) => console.error('Could not load active runs:', error),
    });
  }

  closeRuns(): void {
    this.stopRunPolling();
    this.activeExperimentId.set(null);
    this.runs.set([]);
  }

  ngOnDestroy(): void {
    this.stopRunPolling();
    if (this.activeRunsTimer) clearInterval(this.activeRunsTimer);
  }

  logout(): void {
    this.auth.logout();
  }

  initials(): string {
    const value = this.username().trim();
    return value ? value.slice(0, 2).toLocaleUpperCase() : 'RP';
  }
}
