import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { WcagIssue, StandardStats } from '../../models/jira.models';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
    MatSortModule,
    BaseChartDirective
  ],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {
  issues: WcagIssue[] = [];
  standardsStats: StandardStats[] = [];
  selectedStandard: string = 'all';
  dataSource = new MatTableDataSource<WcagIssue>([]);

  // Overall statistics
  totalIssues = 0;
  completedIssues = 0;
  inProgressIssues = 0;
  overallCompletionPercentage = 0;

  // Chart configurations
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.5,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          padding: 10,
          font: {
            size: 11
          }
        }
      },
    }
  };
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        '#4caf50', // Green for completed
        '#2196f3', // Blue for in progress
        '#ff9800', // Orange for to do
        '#f44336'  // Red for unassigned
      ]
    }]
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'Total Issues', backgroundColor: '#2196f3' },
      { data: [], label: 'Completed', backgroundColor: '#4caf50' }
    ]
  };

  displayedColumns: string[] = ['issue_number', 'standard', 'title', 'status', 'link'];

  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadIssues();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  loadIssues() {
    this.http.get<WcagIssue[]>('jiraIssues.json').subscribe({
      next: (data) => {
        this.issues = data;
        this.analyzeData();
        this.dataSource.data = this.issues;
        this.updateCharts();
      },
      error: (error) => {
        console.error('Error loading issues:', error);
      }
    });
  }

  analyzeData() {
    const standardsMap = new Map<string, WcagIssue[]>();

    // Group issues by standard
    this.issues.forEach(issue => {
      if (!standardsMap.has(issue.standard)) {
        standardsMap.set(issue.standard, []);
      }
      standardsMap.get(issue.standard)!.push(issue);
    });

    // Calculate statistics for each standard
    this.standardsStats = Array.from(standardsMap.entries()).map(([standard, issues]) => {
      const statusCounts: { [key: string]: number } = {};

      issues.forEach(issue => {
        statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
      });

      const completedCount = (statusCounts['Done'] || 0) + (statusCounts['Cancelled'] || 0);
      const totalItems = issues.length;
      const completionPercentage = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

      return {
        standard,
        totalItems,
        statusCounts,
        completionPercentage,
        issues
      };
    });

    // Sort by standard name
    this.standardsStats.sort((a, b) => a.standard.localeCompare(b.standard));

    // Calculate overall statistics
    this.totalIssues = this.issues.length;
    this.completedIssues = this.issues.filter(i => i.status === 'Done' || i.status === 'Cancelled').length;
    this.inProgressIssues = this.issues.filter(i => i.status === 'In Progress' || i.status === 'Development').length;
    this.overallCompletionPercentage = this.totalIssues > 0
      ? (this.completedIssues / this.totalIssues) * 100
      : 0;
  }

  updateCharts() {
    // Update Pie Chart - Status distribution
    const statusCounts: { [key: string]: number } = {};
    this.issues.forEach(issue => {
      statusCounts[issue.status] = (statusCounts[issue.status] || 0) + 1;
    });

    this.pieChartData = {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: [
          '#4caf50', // Accepted Remedied
          '#2196f3', // In Development
          '#ff9800', // To Do
          '#f44336', // Unassigned
          '#9c27b0', // Others
          '#00bcd4'
        ]
      }]
    };

    // Update Bar Chart - Standards distribution
    const topStandards = this.standardsStats.slice(0, 10); // Top 10 standards
    this.barChartData = {
      labels: topStandards.map(s => s.standard),
      datasets: [
        {
          data: topStandards.map(s => s.totalItems),
          label: 'Total Issues',
          backgroundColor: '#2196f3'
        },
        {
          data: topStandards.map(s => (s.statusCounts['Done'] || 0) + (s.statusCounts['Cancelled'] || 0)),
          label: 'Completed',
          backgroundColor: '#4caf50'
        }
      ]
    };
  }

  filterByStandard(standard: string) {
    this.selectedStandard = standard;
    if (standard === 'all') {
      this.dataSource.data = this.issues;
    } else {
      this.dataSource.data = this.issues.filter(issue => issue.standard === standard);
    }
  }

  getJiraLink(issueNumber: string): string {
    return `https://jira.tools.sap/browse/${issueNumber}`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Done':
        return '#4caf50';
      case 'Development':
      case 'In Progress':
        return '#2196f3';
      case 'To Do':
        return '#ff9800';
      case 'Blocked / On Hold':
        return '#9e9e9e';
      case 'Cancelled':
        return '#f44336';
      default:
        return '#757575';
    }
  }

  getCompletionColor(percentage: number): string {
    if (percentage === 100) return '#4caf50';
    if (percentage >= 75) return '#8bc34a';
    if (percentage >= 50) return '#ff9800';
    if (percentage >= 25) return '#ff5722';
    return '#f44336';
  }

  getAllStandards(): string[] {
    return this.standardsStats.map(s => s.standard);
  }
}
