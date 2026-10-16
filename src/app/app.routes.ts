import { Routes } from '@angular/router';

import { ExamsPage } from './features/exams/pages/exams.page';
import { FavoritesPage } from './features/favorites/pages/favorites.page';
import { ProcessDetailPage, ProcessSearchPage } from './features/processes';
import { ProfilePage } from './features/profile/pages/profile.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'procesos' },
  { path: 'procesos', component: ProcessSearchPage, data: { mode: 'all' } },
  { path: 'oportunidades', component: ProcessSearchPage, data: { mode: 'open' } },
  { path: 'favoritos', component: FavoritesPage },
  { path: 'perfil', component: ProfilePage },
  { path: 'examenes', component: ExamsPage },
  { path: 'procesos/:processId', component: ProcessDetailPage },
];
