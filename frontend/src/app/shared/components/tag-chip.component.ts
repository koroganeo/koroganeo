import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-tag-chip',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 cursor-pointer hover:bg-amber-200 transition-colors">
      {{ label() }}
      @if (removable()) {
        <button
          (click)="remove.emit(); $event.stopPropagation()"
          class="ml-1 text-amber-600 hover:text-amber-900 font-bold"
          aria-label="Remove">
          &times;
        </button>
      }
    </span>
  `,
})
export class TagChipComponent {
  label = input.required<string>();
  removable = input(false);
  remove = output<void>();
}
