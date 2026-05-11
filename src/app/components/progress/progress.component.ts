import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { WcagIssue, AppConfig, SprintProgress, StandardProgress } from '../../models/jira.models';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressBarModule,
    MatIconModule
  ],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.css'
})
export class ProgressComponent implements OnInit {
  sprintLanes: SprintProgress[] = [];
  epicKey = '';
  activeSprint = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<AppConfig>('config.json').subscribe(config => {
      this.epicKey = config.epicKey;
      this.activeSprint = config.activeSprint || '';
      this.http.get<WcagIssue[]>('jiraIssues.json').subscribe(data => {
        this.buildLanes(data.filter(i => i.epic === this.epicKey));
      });
    });
  }

  buildLanes(issues: WcagIssue[]) {
    const sprintMap = new Map<string, WcagIssue[]>();

    issues.forEach(issue => {
      const key = issue.sprint || '__unassigned__';
      if (!sprintMap.has(key)) sprintMap.set(key, []);
      sprintMap.get(key)!.push(issue);
    });

    const lanes: SprintProgress[] = [];

    sprintMap.forEach((sprintIssues, sprintName) => {
      const phase = this.getPhase(sprintName);
      const standards = this.buildStandards(sprintIssues);
      const completedIssues = sprintIssues.filter(i => i.status === 'Done' || i.status === 'Cancelled').length;

      lanes.push({
        sprintName: sprintName === '__unassigned__' ? 'Unassigned' : sprintName,
        phase,
        standards,
        totalIssues: sprintIssues.length,
        completedIssues,
        overallPct: sprintIssues.length > 0 ? (completedIssues / sprintIssues.length) * 100 : 0
      });
    });

    // Sort: past → current → future → unassigned
    const phaseOrder = { past: 0, current: 1, future: 2, unassigned: 3 };
    lanes.sort((a, b) => {
      if (a.phase !== b.phase) return phaseOrder[a.phase] - phaseOrder[b.phase];
      return a.sprintName.localeCompare(b.sprintName);
    });

    this.sprintLanes = lanes;
  }

  buildStandards(issues: WcagIssue[]): StandardProgress[] {
    const stdMap = new Map<string, WcagIssue[]>();

    issues.forEach(issue => {
      const base = issue.standard.replace(/\.\d+$/, ''); // ACC-261.1 → ACC-261
      if (!stdMap.has(base)) stdMap.set(base, []);
      stdMap.get(base)!.push(issue);
    });

    return Array.from(stdMap.entries())
      .map(([standard, stdIssues]) => {
        const statusCounts: { [key: string]: number } = {};
        stdIssues.forEach(i => {
          statusCounts[i.status] = (statusCounts[i.status] || 0) + 1;
        });
        const completed = (statusCounts['Done'] || 0) + (statusCounts['Cancelled'] || 0);
        return {
          standard,
          total: stdIssues.length,
          completed,
          completionPct: stdIssues.length > 0 ? (completed / stdIssues.length) * 100 : 0,
          statusCounts
        };
      })
      .sort((a, b) => a.standard.localeCompare(b.standard));
  }

  getPhase(sprintName: string): 'past' | 'current' | 'future' | 'unassigned' {
    if (sprintName === '__unassigned__') return 'unassigned';
    if (sprintName === this.activeSprint) return 'current';
    return sprintName < this.activeSprint ? 'past' : 'future';
  }

  getPhaseColor(phase: string): string {
    switch (phase) {
      case 'past': return '#4caf50';
      case 'current': return '#1976d2';
      case 'future': return '#9e9e9e';
      case 'unassigned': return '#ff9800';
      default: return '#757575';
    }
  }

  getPhaseBadge(phase: string): string {
    switch (phase) {
      case 'past': return 'Done';
      case 'current': return 'Current Sprint';
      case 'future': return 'Planned';
      case 'unassigned': return 'Unassigned';
      default: return '';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Done': return '#4caf50';
      case 'Development':
      case 'In Progress': return '#2196f3';
      case 'To Do': return '#ff9800';
      case 'Blocked / On hold': return '#9e9e9e';
      case 'Cancelled': return '#f44336';
      default: return '#757575';
    }
  }
}
