# Update Epic Issues JSON

Fetch all issues from a Jira epic and write them to a JSON file. Run this **once** to bootstrap the JSON — use `/sync-issue-statuses` for ongoing status updates.

## Usage
`/update-epic-issues <EPIC_KEY> [OUTPUT_FILE]`

- `EPIC_KEY` — Jira epic key, e.g. `CXCDC-30702` (required)
- `OUTPUT_FILE` — path relative to `public/`, defaults to `jiraIssues.json` (optional)

## Steps

1. **Authenticate** with the SAP Jira MCP if needed (call `sap_authenticate` with `entry_url: "https://jira.tools.sap/"` and `store_path: "~/.sap-mcp/cookies/cdc-jira"` if you get a `SAP_AUTH_REQUIRED` error).

2. **Fetch all issues in the epic** using `search_issues` with JQL:
   ```
   project = CXCDC AND "Epic Link" = <EPIC_KEY> ORDER BY created ASC
   ```
   Request fields: `summary`, `status`, `labels`, `issuetype`, `story_points`, `customfield_10016`. Use `maxResults: 100`.

3. **For each issue**, build a JSON entry:
   - `issue_number` — the issue key (e.g. `CXCDC-34387`)
   - `standard` — the first label matching the pattern `ACC-\d+\.\d+` (e.g. `ACC-263.1`). If no such label exists, set to `"N/A"`
   - `title` — the issue summary with the leading `ACC-XXX.X ` prefix removed (if present)
   - `status` — the current Jira status (e.g. `Done`, `To Do`, `Development`, `Cancelled`)
   - `epic` — the `EPIC_KEY` argument passed to this skill
   - `effort` — story points from `story_points` or `customfield_10016`; default to `0` if not set

   If an issue has no labels at all, call `get_issue` with `fields: ["labels"]` to retrieve them explicitly.

4. **Write the result** as a JSON array to `public/<OUTPUT_FILE>` (default: `public/jiraIssues.json`).

5. **Write the epic key** to `public/config.json` as `{ "epicKey": "<EPIC_KEY>" }`.

6. **Report** a short summary: total issues written, how many had a standard, how many had `standard: "N/A"`.
