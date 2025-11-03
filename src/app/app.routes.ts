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
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'tarea-form',
    loadComponent: () => import('./pages/tarea-form/tarea-form.page').then( m => m.TareaFormPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  }
];
