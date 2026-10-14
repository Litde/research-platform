import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';


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
  name = '';
  description = '';
  showForm = false;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.loadExperiments();
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
