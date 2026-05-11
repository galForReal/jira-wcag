import { Routes } from '@angular/router';
import { EpicViewerComponent } from './components/epic-viewer/epic-viewer.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { ProgressComponent } from './components/progress/progress.component';

export const routes: Routes = [
  { path: '', redirectTo: '/analytics', pathMatch: 'full' },
  { path: 'epic-viewer', component: EpicViewerComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'progress', component: ProgressComponent }
];
