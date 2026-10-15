import { Routes } from '@angular/router';

import { FavoritesPage } from './features/favorites/pages/favorites.page';
import { ProcessDetailPage, ProcessSearchPage } from './features/processes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'procesos' },
  { path: 'procesos', component: ProcessSearchPage, data: { mode: 'all' } },
  { path: 'oportunidades', component: ProcessSearchPage, data: { mode: 'open' } },
  { path: 'favoritos', component: FavoritesPage },
  { path: 'procesos/:processId', component: ProcessDetailPage },
];
