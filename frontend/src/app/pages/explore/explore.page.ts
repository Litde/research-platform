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
  createdAt?: string;
}

interface ExperimentRun {
  id: string;
  experimentId: string;
  experimentName: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  samples: number;
  estimate: number | null;
  durationMillis: number;
  createdAt: string;
}

interface MonthStat {
  key: string;
  label: string;
  completed: number;
  averageSeconds: number;
  barHeight: number;
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
  readonly monthlyStats = computed<MonthStat[]>(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - 5 + index, 1));
    const completedRuns = this.runs().filter((run) => run.status === 'COMPLETED');
    const counts = months.map((month) => {
      const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      const matching = completedRuns.filter((run) => run.createdAt?.slice(0, 7) === key);
      const average = matching.length ? matching.reduce((sum, run) => sum + run.durationMillis, 0) / matching.length / 1000 : 0;
      return { key, label: month.toLocaleDateString('en', { month: 'short' }), completed: matching.length, averageSeconds: average };
    });
    const max = Math.max(1, ...counts.map((item) => item.completed));
    return counts.map((item) => ({ ...item, barHeight: item.completed ? Math.max(8, item.completed / max * 100) : 0 }));
  });
  readonly completedCount = computed(() => this.runs().filter((run) => run.status === 'COMPLETED').length);
  readonly averageDuration = computed(() => {
    const completed = this.runs().filter((run) => run.status === 'COMPLETED');
    return completed.length ? completed.reduce((sum, run) => sum + run.durationMillis, 0) / completed.length / 1000 : 0;
  });

  constructor() {
    this.http.get<Experiment[]>('http://localhost:8080/api/experiments').subscribe({
      next: (items) => { this.experiments.set(items); this.loading.set(false); },
      error: (err: { status: number }) => { this.error.set(`Could not load experiments (HTTP ${err.status}).`); this.loading.set(false); },
    });
    this.http.get<ExperimentRun[]>('http://localhost:8080/api/experiment-runs/history').subscribe({
      next: (items) => { this.runs.set(items); this.historyLoading.set(false); },
      error: (err: { status: number }) => { this.error.set(`Could not load simulation history (HTTP ${err.status}).`); this.historyLoading.set(false); },
    });
  }
}
