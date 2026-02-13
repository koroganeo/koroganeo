import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="text-center py-12">
      <div class="text-6xl mb-4 text-slate-300">&#128196;</div>
      <h3 class="text-lg font-semibold text-slate-700 mb-2">{{ title() }}</h3>
      <p class="text-slate-500">{{ message() }}</p>
    </div>
  `,
})
export class EmptyStateComponent {
  title = input('No results');
  message = input('Try adjusting your filters');
}
