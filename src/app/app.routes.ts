import { Routes } from '@angular/router';

import { ProcessDetailPage, ProcessSearchPage } from './features/processes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'procesos' },
  { path: 'procesos', component: ProcessSearchPage },
  { path: 'procesos/:processId', component: ProcessDetailPage },
];
