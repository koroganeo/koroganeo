import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/article-list/article-list.component').then(m => m.ArticleListComponent),
  },
  {
    path: 'article/:slug',
    loadComponent: () =>
      import('./features/article-detail/article-detail.component').then(m => m.ArticleDetailComponent),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/search/search-results.component').then(m => m.SearchResultsComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
