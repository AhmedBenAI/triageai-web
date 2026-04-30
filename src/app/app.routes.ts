import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TriageComponent } from './pages/triage/triage.component';
import { KnowledgeBaseComponent } from './pages/knowledge-base/knowledge-base.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'triage', component: TriageComponent },
  { path: 'knowledge-base', component: KnowledgeBaseComponent },
  { path: '**', redirectTo: '' },
];
