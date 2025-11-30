import { Routes } from '@angular/router';
import { EpicViewerComponent } from './components/epic-viewer/epic-viewer.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';

export const routes: Routes = [
  { path: '', redirectTo: '/analytics', pathMatch: 'full' },
  { path: 'epic-viewer', component: EpicViewerComponent },
  { path: 'analytics', component: AnalyticsComponent }
];
