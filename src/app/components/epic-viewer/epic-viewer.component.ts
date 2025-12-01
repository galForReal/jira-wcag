import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { JiraService } from '../../services/jira.service';
import { JiraIssue } from '../../models/jira.models';

@Component({
  selector: 'app-epic-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatSortModule
  ],
  templateUrl: './epic-viewer.component.html',
  styleUrl: './epic-viewer.component.css'
})
export class EpicViewerComponent {
  epicInput: string = '';
  username: string = '';
  password: string = '';
  dataSource = new MatTableDataSource<JiraIssue>([]);
  loading: boolean = false;
  error: string = '';
  showCredentials: boolean = false;
  displayedColumns: string[] = ['key', 'summary', 'status', 'labels', 'assignee', 'issuetype'];

  @ViewChild(MatSort) sort!: MatSort;

  constructor(private jiraService: JiraService) {}

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  onSubmit(): void {
    if (!this.epicInput.trim()) {
      this.error = 'Please enter an Epic URL or key';
      return;
    }

    this.loading = true;
    this.error = '';
    this.dataSource.data = [];

    // Set credentials if provided (only password/token is needed)
    if (this.password && this.password.trim()) {
      console.log('Setting token in service...');
      this.jiraService.setCredentials(this.username, this.password);
    } else {
      console.log('No token provided by user');
    }

    try {
      const epicKey = this.jiraService.extractEpicKey(this.epicInput);

      this.jiraService.getIssuesByEpic(epicKey).subscribe({
        next: (issues) => {
          this.loading = false;
          this.dataSource.data = issues;

          if (issues.length === 0) {
            this.error = `No issues found for Epic: ${epicKey}`;
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = err.message || 'An error occurred while fetching issues';
          console.error('Error fetching issues:', err);
        }
      });
    } catch (err: any) {
      this.loading = false;
      this.error = err.message || 'Invalid Epic URL or key format';
    }
  }

  getIssueUrl(issueKey: string): string {
    return this.jiraService.getIssueUrl(issueKey);
  }

  clearResults(): void {
    this.epicInput = '';
    this.dataSource.data = [];
    this.error = '';
  }

  toggleCredentials(): void {
    this.showCredentials = !this.showCredentials;
  }

  testConnection(): void {
    if (!this.password || !this.password.trim()) {
      this.error = 'Please enter a Personal Access Token first';
      return;
    }

    this.loading = true;
    this.error = '';
    this.jiraService.setCredentials(this.username, this.password);

    this.jiraService.testConnection().subscribe({
      next: (user) => {
        this.loading = false;
        this.error = '';
        alert(`✅ Connection successful!\n\nLogged in as: ${user.displayName}\nEmail: ${user.emailAddress}`);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'Connection test failed';
      }
    });
  }
}
