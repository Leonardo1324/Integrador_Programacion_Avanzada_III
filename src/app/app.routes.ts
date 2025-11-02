import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'tablero',
    loadComponent: () => import('./pages/tablero/tablero.page').then( m => m.TableroPage)
  },
  {
    path: 'inbox',
    loadComponent: () => import('./pages/inbox/inbox.page').then( m => m.InboxPage)
  },
  {
    path: '',
    redirectTo: 'tablero',
    pathMatch: 'full',
  }
];
