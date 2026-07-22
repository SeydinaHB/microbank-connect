import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'clients',
        canActivate: [roleGuard(['agent', 'gestionnaire'])],
        loadComponent: () =>
          import('./features/clients/client-list/client-list.component').then(m => m.ClientListComponent)
      },
      {
        path: 'clients/nouveau',
        canActivate: [roleGuard(['agent', 'gestionnaire'])],
        loadComponent: () =>
          import('./features/clients/client-form/client-form.component').then(m => m.ClientFormComponent)
      },
      {
        path: 'clients/:id',
        canActivate: [roleGuard(['agent', 'gestionnaire'])],
        loadComponent: () =>
          import('./features/clients/client-detail/client-detail.component').then(m => m.ClientDetailComponent)
      },
      {
        path: 'comptes',
        loadComponent: () =>
          import('./features/comptes/compte-list/compte-list.component').then(m => m.CompteListComponent)
      },
      {
        path: 'comptes/nouveau',
        canActivate: [roleGuard(['agent', 'gestionnaire'])],
        loadComponent: () =>
          import('./features/comptes/compte-form/compte-form.component').then(m => m.CompteFormComponent)
      },
      {
        path: 'operations',
        canActivate: [roleGuard(['agent', 'gestionnaire'])],
        loadComponent: () =>
          import('./features/operations/operation-form/operation-form.component').then(m => m.OperationFormComponent)
      },
      {
        path: 'credits',
        loadComponent: () =>
          import('./features/credits/credit-list/credit-list.component').then(m => m.CreditListComponent)
      },
      {
        path: 'credits/nouveau',
        loadComponent: () =>
          import('./features/credits/credit-simulation/credit-simulation.component').then(m => m.CreditSimulationComponent)
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];