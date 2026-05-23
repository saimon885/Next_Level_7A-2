export interface Iissu {
  title?: string;
  description?: string;
  type?: string;
  status?: string;
}

export interface IssueQuery {
  sort?: "newest" | "oldest";
  type?: string;
  status?: string;
}

export interface FormattedIssue {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  reporter: {
    id: number;
    name: string;
    role: string;
  };
  created_at: string;
  updated_at: string;
}
