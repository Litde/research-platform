import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Experiment {
  id?: string;
  name: string;
  description: string;
  ownerId?: string;
  publiclyVisible: boolean;
  type?: string;
  metrics?: { key: string; label: string; unit: string; chartType: string }[];
  chartMetricKey?: string;
  createdAt?: string;
}

interface ExperimentRun {
  id: string;
  experimentId: string;
  experimentName: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  samples: number;
  estimate: number | null;
  metricValues?: Record<string, number>;
  durationMillis: number;
  createdAt: string;
}

interface DayStat {
  key: string;
  label: string;
  completed: number;
  metricAverage: number;
  barHeight: number;
}

interface ScatterPoint {
  x: number;
  y: number;
  estimate: number;
  samples: number;
  experimentName: string;
}

@Component({
  selector: 'app-explore-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './explore.page.html',
  styleUrl: './explore.page.css',
})
export class ExplorePage {
  private readonly http = inject(HttpClient);
  readonly experiments = signal<Experiment[]>([]);
  readonly runs = signal<ExperimentRun[]>([]);
  readonly loading = signal(true);
  readonly historyLoading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly visibility = signal('all');
  readonly sortBy = signal('newest');
  readonly selectedMetric = signal('estimate');
  readonly weekOffset = signal(0);
  readonly availableMetrics = computed(() => {
    const definitions = this.experiments().flatMap((experiment) => experiment.metrics?.length ? experiment.metrics : [
      { key: 'estimate', label: 'Pi estimate', unit: '', chartType: 'line' },
      { key: 'durationMillis', label: 'Compute time', unit: 'ms', chartType: 'line' },
      { key: 'samples', label: 'Number of samples', unit: 'count', chartType: 'line' },
    ]);
    const unique = new Map(definitions.map((metric) => [metric.key, metric]));
    return [...unique.values()];
  });
  readonly filteredExperiments = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    const visibility = this.visibility();
    const result = this.experiments().filter((item) => {
      const matchesQuery = !query || `${item.name} ${item.description}`.toLocaleLowerCase().includes(query);
      const matchesVisibility = visibility === 'all' || (visibility === 'public') === item.publiclyVisible;
      return matchesQuery && matchesVisibility;
    });
    return [...result].sort((a, b) => {
      if (this.sortBy() === 'name') return a.name.localeCompare(b.name);
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return this.sortBy() === 'oldest' ? dateA - dateB : dateB - dateA;
    });
  });
  readonly selectedWeekStart = computed(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day + this.weekOffset() * 7);
    return start;
  });
  readonly selectedWeekLabel = computed(() => {
    const start = this.selectedWeekStart();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const from = start.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    const to = end.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${from} – ${to}`;
  });
  readonly weeklyStats = computed<DayStat[]>(() => {
    const start = this.selectedWeekStart();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(date.getDate() + index);
      return date;
    });
    const completedRuns = this.runs().filter((run) => run.status === 'COMPLETED');
    const daysInWeek = days.map((date) => {
      const key = this.dateKey(date);
      const matching = completedRuns.filter((run) => this.dateKey(new Date(run.createdAt)) === key);
      const metricValues = matching.map((run) => {
        const saved = run.metricValues?.[this.selectedMetric()];
        if (typeof saved === 'number') return saved;
        if (this.selectedMetric() === 'estimate') return run.estimate ?? undefined;
        if (this.selectedMetric() === 'durationMillis') return run.durationMillis;
        if (this.selectedMetric() === 'samples') return run.samples;
        return undefined;
      }).filter((value): value is number => typeof value === 'number');
      const metricAverage = metricValues.length ? metricValues.reduce((sum, value) => sum + value, 0) / metricValues.length : 0;
      return { key, label: date.toLocaleDateString('en', { weekday: 'short', day: 'numeric' }), completed: metricValues.length, metricAverage };
    });
    const max = Math.max(1, ...daysInWeek.map((item) => Math.abs(item.metricAverage)));
    return daysInWeek.map((item) => ({ ...item, barHeight: item.metricAverage ? Math.max(8, Math.abs(item.metricAverage) / max * 100) : 0 }));
  });
  readonly scatterPoints = computed<ScatterPoint[]>(() => {
    const points = this.runs().filter((run) => run.status === 'COMPLETED' && run.estimate !== null && run.samples > 0);
    if (!points.length) return [];
    const minSamples = Math.min(...points.map((run) => run.samples));
    const maxSamples = Math.max(...points.map((run) => run.samples));
    const logRange = Math.log10(maxSamples) - Math.log10(minSamples);
    const minEstimate = Math.min(Math.PI, ...points.map((run) => run.estimate!));
    const maxEstimate = Math.max(Math.PI, ...points.map((run) => run.estimate!));
    const estimateRange = maxEstimate - minEstimate || 1;
    return points.map((run) => ({
      x: 10 + (logRange ? (Math.log10(run.samples) - Math.log10(minSamples)) / logRange * 80 : 40),
      y: 90 - (run.estimate! - minEstimate) / estimateRange * 75,
      estimate: run.estimate!,
      samples: run.samples,
      experimentName: run.experimentName,
    }));
  });
  readonly scatterReferenceY = computed(() => {
    const values = this.runs().filter((run) => run.status === 'COMPLETED' && run.estimate !== null).map((run) => run.estimate!);
    if (!values.length) return 50;
    const min = Math.min(Math.PI, ...values);
    const max = Math.max(Math.PI, ...values);
    return 90 - (Math.PI - min) / (max - min || 1) * 75;
  });
  readonly completedCount = computed(() => this.runs().filter((run) => run.status === 'COMPLETED').length);
  readonly averageDuration = computed(() => {
    const completed = this.runs().filter((run) => run.status === 'COMPLETED');
    return completed.length ? completed.reduce((sum, run) => sum + run.durationMillis, 0) / completed.length / 1000 : 0;
  });

  constructor() {
    this.http.get<Experiment[]>('http://localhost:8080/api/experiments').subscribe({
      next: (items) => {
        this.experiments.set(items);
        this.selectedMetric.set(items[0]?.chartMetricKey ?? 'estimate');
        this.loading.set(false);
      },
      error: (err: { status: number }) => { this.error.set(`Could not load experiments (HTTP ${err.status}).`); this.loading.set(false); },
    });
    this.http.get<ExperimentRun[]>('http://localhost:8080/api/experiment-runs/history').subscribe({
      next: (items) => { this.runs.set(items); this.historyLoading.set(false); },
      error: (err: { status: number }) => { this.error.set(`Could not load simulation history (HTTP ${err.status}).`); this.historyLoading.set(false); },
    });
  }

  changeWeek(offset: number): void {
    this.weekOffset.update((current) => Math.min(0, current + offset));
  }

  private dateKey(date: Date): string {
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
