import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { JiraIssue, JiraSearchResponse, JiraIssueRaw } from '../models/jira.models';

@Injectable({
  providedIn: 'root'
})
export class JiraService {
  private readonly JIRA_BASE_URL = 'https://jira.tools.sap';
  private readonly API_PATH = '/rest/api/2/search';

  // Store credentials in memory (not secure for production, but OK for internal tool)
  private username: string = '';
  private password: string = '';

  constructor(private http: HttpClient) {}

  /**
   * Set authentication credentials
   */
  setCredentials(username: string, password: string): void {
    this.username = username;
    this.password = password;
  }

  /**
   * Test connection to Jira using a lightweight endpoint
   */
  testConnection(): Observable<any> {
    const url = '/rest/api/2/myself';

    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (this.password) {
      headers = headers.set('Authorization', `Bearer ${this.password}`);
    }

    return this.http.get(url, {
      headers,
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Extract Epic key from Jira URL
   * Example: https://jira.tools.sap/browse/CXCDC-30694 -> CXCDC-30694
   */
  extractEpicKey(urlOrKey: string): string {
    const trimmed = urlOrKey.trim();

    // If it's already just a key (e.g., "CXCDC-30694")
    const keyPattern = /^[A-Z]+-\d+$/;
    if (keyPattern.test(trimmed)) {
      return trimmed;
    }

    // If it's a URL, extract the key
    const urlPattern = /browse\/([A-Z]+-\d+)/;
    const match = trimmed.match(urlPattern);

    if (match && match[1]) {
      return match[1];
    }

    throw new Error('Invalid Epic URL or key format');
  }

  /**
   * Fetch all issues under a given Epic
   */
  getIssuesByEpic(epicKey: string, useDirect: boolean = false): Observable<JiraIssue[]> {
    // Try multiple JQL formats for Epic Link
    // Newer Jira versions use "parent" field, older versions use "Epic Link"
    const jql = `parent = ${epicKey} OR "Epic Link" = ${epicKey}`;
    const fields = 'summary,status,labels,assignee,issuetype';

    // Use proxy to avoid CORS issues
    const url = this.API_PATH;

    const params = {
      jql: jql,
      fields: fields,
      maxResults: '1000' // Adjust if needed
    };

    // Build headers with Bearer token
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (this.password) {
      headers = headers.set('Authorization', `Bearer ${this.password}`);
      console.log('Using Bearer Token Authentication');
    }

    console.log('Fetching issues with JQL:', jql);

    return this.http.get<JiraSearchResponse>(url, {
      params,
      headers,
      withCredentials: true // This sends cookies including JSESSIONID
    }).pipe(
      map(response => {
        console.log('Jira API Response:', response);
        return this.transformIssues(response.issues);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Transform raw Jira API response to simplified JiraIssue interface
   */
  private transformIssues(rawIssues: JiraIssueRaw[]): JiraIssue[] {
    return rawIssues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      labels: issue.fields.labels || [],
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      issuetype: issue.fields.issuetype.name
    }));
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    console.error('Jira API Error Details:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error,
      url: error.url,
      headers: error.headers.keys().reduce((acc, key) => {
        acc[key] = error.headers.get(key);
        return acc;
      }, {} as any)
    });

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to Jira. Please ensure you are connected to the VPN and restart the dev server.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please enter a valid Personal Access Token.';
          break;
        case 403:
          errorMessage = 'Forbidden. You do not have permission to access this Epic or Basic Auth is disabled.';
          break;
        case 404:
          errorMessage = 'Epic not found. Please check the Epic key.';
          break;
        case 400:
          errorMessage = `Invalid request: ${error.error?.errorMessages?.join(', ') || 'Please check the Epic key format.'}`;
          break;
        case 429:
          errorMessage = 'Rate limit exceeded. Too many requests to Jira. Please wait a few minutes and try again.';
          break;
        default:
          errorMessage = `Server error: ${error.status} - ${error.error?.errorMessages?.join(', ') || error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Get the Jira URL for a specific issue key
   */
  getIssueUrl(issueKey: string): string {
    return `${this.JIRA_BASE_URL}/browse/${issueKey}`;
  }
}
