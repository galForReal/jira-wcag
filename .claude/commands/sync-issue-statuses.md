# Sync Issue Statuses

Read all issues from the JSON file, fetch their current state from Jira in batches, and update `status`, `effort`, `epic`, and `sprint` in place. Run this for ongoing tracking after the initial bootstrap via `/update-epic-issues`.

## Usage
`/sync-issue-statuses [INPUT_FILE]`

- `INPUT_FILE` — path relative to `public/`, defaults to `jiraIssues.json` (optional)

## Steps

1. **Authenticate** with the SAP Jira MCP if needed (call `sap_authenticate` with `entry_url: "https://jira.tools.sap/"` and `store_path: "~/.sap-mcp/cookies/cdc-jira"` if you get a `SAP_AUTH_REQUIRED` error).

2. **Read** `public/<INPUT_FILE>` and collect all `issue_number` values.

3. **Fetch current Jira state** for each issue individually using `get_issue` (full call, no field filter). The full response exposes Epic Link and story points.

4. **Build a lookup map** from the results: `issue_number → { status, epic, effort }`:
   - `status` — current Jira status name
   - `epic` — value from the `**Epic Link:**` field in the response; keep existing value if absent
   - `effort` — value from the `**Story Points:**` field; keep existing value if absent or zero

5. **Build sprint assignments** using JQL — the sprint field is not exposed by `get_issue`, so query by sprint instead:
   - Call `list_sprints` with `boardId: 37835`, `state: "active"` → get active sprint ID + name
   - Call `list_sprints` with `boardId: 37835`, `state: "future"` → get future sprint IDs + names
   - For each sprint (active + future), call `search_issues` with JQL:
     ```
     project = CXCDC AND "Epic Link" = <epicKey> AND sprint = <sprintId>
     ```
     Map all returned issue keys to that sprint name. Issues not found in any sprint get `sprint: null`.

6. **Update the JSON array** in memory: for each entry, apply status/epic/effort from the lookup map and sprint from the sprint assignment map. Leave `issue_number`, `standard`, and `title` untouched.

7. **Write** the updated array back to `public/<INPUT_FILE>`.

8. **Update `public/config.json`**: use the active sprint name from step 5. Read the current `config.json`, update the `activeSprint` field (preserve `epicKey`), and write it back.

9. **Report** a short summary:
   - Total issues synced
   - How many had a status change vs. no change
   - How many have `effort > 0`
   - How many have a non-empty `epic`
   - How many have a non-null `sprint`
   - Active sprint written to `config.json`
