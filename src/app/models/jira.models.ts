export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  labels: string[];
  assignee: string;
  issuetype: string;
}

export interface JiraFields {
  summary: string;
  status: {
    name: string;
  };
  labels: string[];
  assignee: {
    displayName: string;
  } | null;
  issuetype: {
    name: string;
  };
}

export interface JiraIssueRaw {
  key: string;
  fields: JiraFields;
}

export interface JiraSearchResponse {
  issues: JiraIssueRaw[];
  total: number;
  maxResults: number;
  startAt: number;
}

// Analytics specific models
export interface WcagIssue {
  issue_number: string;
  standard: string;
  title: string;
  status: string;
}

export interface StandardStats {
  standard: string;
  totalItems: number;
  statusCounts: { [key: string]: number };
  completionPercentage: number;
  issues: WcagIssue[];
}
