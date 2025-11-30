# Jira Epic Issue Viewer

A lightweight Angular 19 web application that connects to the company Jira instance (https://jira.tools.sap) and displays all issues under a given Epic.

## Overview

This application provides a simple, read-only interface to view all issues associated with a Jira Epic. It displays key information including summary, status, labels, assignee, and issue type in a clean, Material Design table.

## Features

- **Epic URL/Key Input**: Accept either full Jira URLs or Epic keys
- **Issue Display**: Shows all issues under an Epic with:
  - Issue Key (clickable link to Jira)
  - Summary
  - Status (with color-coded badges)
  - Labels (as chips)
  - Assignee
  - Issue Type
- **Real-time Validation**: Input validation and error handling
- **Responsive Design**: Works on desktop and mobile devices
- **Material Design**: Clean, modern UI using Angular Material

## Prerequisites

- Node.js (v18 or higher)
- Angular CLI (v19)
- Access to SAP company VPN
- Active Jira session (logged into https://jira.tools.sap)

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Server

Start the development server:

```bash
ng serve
```

Navigate to `http://localhost:4200/` in your browser. The application will automatically reload when you make changes to the source files.

### Production Build

Build the application for production:

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Usage

1. **Connect to VPN**: Ensure you are connected to the company VPN

2. **Login to Jira**: Open https://jira.tools.sap in your browser and log in to establish a session

3. **Open the Application**: Navigate to the app (http://localhost:4200/ for development)

4. **Enter Epic Information**:
   - Paste the full Epic URL: `https://jira.tools.sap/browse/CXCDC-30694`
   - Or just the Epic key: `CXCDC-30694`

5. **View Issues**: Click "Fetch Issues" to retrieve and display all issues under the Epic

6. **Navigate**: Click on any issue key to open it in Jira in a new tab

## Authentication

The application uses cookie-based authentication (JSESSIONID) to access the Jira API. This means:

- You must be logged into Jira in the same browser
- The session cookie is automatically sent with API requests
- If your session expires, you'll need to log into Jira again

## Error Handling

The application handles various error scenarios:

- **Invalid Epic Key**: Shows error message for incorrectly formatted Epic keys
- **No Issues Found**: Displays message when Epic has no associated issues
- **VPN Required**: Error message if you're not connected to VPN
- **Unauthorized**: Prompts you to log into Jira
- **Forbidden**: Indicates insufficient permissions
- **Not Found**: Epic key doesn't exist

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── epic-viewer/          # Main Epic viewer component
│   │       ├── epic-viewer.component.ts
│   │       ├── epic-viewer.component.html
│   │       └── epic-viewer.component.css
│   ├── services/
│   │   └── jira.service.ts       # Jira API service
│   ├── models/
│   │   └── jira.models.ts        # TypeScript interfaces
│   ├── app.component.ts           # Root component
│   ├── app.config.ts              # App configuration
│   └── app.routes.ts              # Routing configuration
├── styles.css                     # Global styles
└── index.html                     # Main HTML file
```

## Key Components

### JiraService (`src/app/services/jira.service.ts`)

Handles all Jira API interactions:
- `extractEpicKey(urlOrKey: string)`: Extracts Epic key from URL or validates key format
- `getIssuesByEpic(epicKey: string)`: Fetches all issues under an Epic
- `getIssueUrl(issueKey: string)`: Generates Jira issue URL

### EpicViewerComponent (`src/app/components/epic-viewer/`)

Main UI component that:
- Manages user input
- Displays loading state
- Shows error messages
- Renders issues in a Material table

### Models (`src/app/models/jira.models.ts`)

TypeScript interfaces for type safety:
- `JiraIssue`: Simplified issue data
- `JiraSearchResponse`: API response structure
- `JiraFields`: Issue field details

## API Integration

The application uses the Jira REST API v2:

**Endpoint**: `GET /rest/api/2/search`

**Query Parameters**:
- `jql`: `"Epic Link" = <EPIC_KEY>`
- `fields`: `summary,status,labels,assignee,issuetype`
- `maxResults`: `1000`

## Customization

### Add More Fields

To display additional fields, modify:

1. Update `JiraFields` interface in `jira.models.ts`
2. Add field to API request in `jira.service.ts`
3. Update table columns in `epic-viewer.component.ts`
4. Add column definition in `epic-viewer.component.html`

### Change Jira Instance

To use a different Jira instance, update `JIRA_BASE_URL` in `jira.service.ts`:

```typescript
private readonly JIRA_BASE_URL = 'https://your-jira-instance.com';
```

### Styling

- Global styles: `src/styles.css`
- Component styles: `src/app/components/epic-viewer/epic-viewer.component.css`
- Status badge colors are defined in the component CSS

## Known Limitations

- Read-only functionality (no issue creation/editing)
- Maximum 1000 issues per Epic
- Requires active VPN connection
- Requires active Jira session in the same browser
- CORS restrictions may require proxy configuration in production

## Future Enhancements

Potential improvements for future versions:

- Pagination for large Epics
- Filtering by status, label, assignee
- Sortable table columns
- Export to CSV/Excel
- Display assignee avatars
- More detailed issue view
- Comments display
- Time tracking information

## Important Configuration

### Proxy Configuration (Already Set Up)

This application is pre-configured with a proxy to handle CORS issues when connecting to the Jira API. The proxy configuration is already in place:

- **proxy.conf.json**: Routes `/rest` API calls to `https://jira.tools.sap`
- **angular.json**: Configured to use the proxy automatically in development mode
- **JiraService**: Uses relative URLs to work with the proxy

**No additional setup is needed** - just ensure you're connected to the VPN and logged into Jira.

## Troubleshooting

### Unable to Connect / CORS Errors

If you see "Unable to connect to Jira" errors:

1. **Restart the development server**: The proxy configuration requires a server restart
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   ng serve
   ```

2. **Verify VPN connection**: Ensure you're connected to the SAP VPN

3. **Check Jira session**: Open https://jira.tools.sap in your browser and ensure you're logged in

4. **Check proxy logs**: The proxy logs to the console. Look for proxy-related messages when making requests

### Session Expired

If you get unauthorized errors:
1. Open https://jira.tools.sap in a new tab
2. Log in to Jira
3. Return to the app and try again

### VPN Issues

Ensure you're connected to the SAP VPN before using the application.

## Technologies Used

- **Angular 19**: Frontend framework
- **Angular Material 19**: UI component library
- **TypeScript**: Programming language
- **RxJS**: Reactive programming
- **Jira REST API v2**: Data source

## License

Internal use only - SAP proprietary

## Support

For issues or questions, please contact the development team.

---

**Note**: This application is for internal use only and requires SAP VPN access and Jira credentials.
