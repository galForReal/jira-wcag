# Sync Issue Statuses

Read all issues from the JSON file, fetch their current state from Jira in batches, and update `status`, `effort`, and `epic` in place. Run this for ongoing tracking after the initial bootstrap via `/update-epic-issues`.

## Usage
`/sync-issue-statuses [INPUT_FILE]`

- `INPUT_FILE` — path relative to `public/`, defaults to `jiraIssues.json` (optional)

## Steps

1. **Authenticate** with the SAP Jira MCP if needed (call `sap_authenticate` with `entry_url: "https://jira.tools.sap/"` and `store_path: "~/.sap-mcp/cookies/cdc-jira"` if you get a `SAP_AUTH_REQUIRED` error).

2. **Read** `public/<INPUT_FILE>` and collect all `issue_number` values.

3. **Fetch current Jira state** in batches of 50 using `search_issues` with JQL:
   ```
   issueKey in (CXCDC-xxx, CXCDC-yyy, ...) ORDER BY key ASC
   ```
   Request fields: `summary`, `status`, `customfield_10014`, `story_points`, `customfield_10016`. Use `maxResults: 50`.
   - `customfield_10014` is the Epic Link field.

4. **Build a lookup map** from the results: `issue_number → { status, epic, effort }`:
   - `status` — current Jira status name
   - `epic` — value from `customfield_10014`; keep existing value if the field is absent from the response
   - `effort` — story points from `story_points` or `customfield_10016`; keep existing value if not set

5. **Update the JSON array** in memory: for each entry, apply the values from the lookup map. Leave `issue_number`, `standard`, and `title` untouched.

6. **Write** the updated array back to `public/<INPUT_FILE>`.

7. **Report** a short summary:
   - Total issues synced
   - How many had a status change vs. no change
   - How many have `effort > 0`
   - How many have a non-empty `epic`
