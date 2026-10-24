import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'style-guide' },
  {
    path: 'style-guide',
    loadComponent: () =>
      import('@features/style-guide/style-guide').then((m) => m.StyleGuide),
  },
];
