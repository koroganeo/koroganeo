import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    <nav class="flex justify-center items-center gap-2 mt-8" aria-label="Pagination">
      <button
        (click)="pageChange.emit(currentPage() - 1)"
        [disabled]="currentPage() <= 1"
        class="px-3 py-2 rounded border border-slate-300 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
        &laquo; Prev
      </button>

      @for (page of visiblePages(); track page) {
        @if (page === -1) {
          <span class="px-2 text-slate-400">...</span>
        } @else {
          <button
            (click)="pageChange.emit(page)"
            [class.bg-blue-600]="page === currentPage()"
            [class.text-white]="page === currentPage()"
            class="px-3 py-2 rounded border border-slate-300 text-sm hover:bg-slate-50">
            {{ page }}
          </button>
        }
      }

      <button
        (click)="pageChange.emit(currentPage() + 1)"
        [disabled]="currentPage() >= totalPages()"
        class="px-3 py-2 rounded border border-slate-300 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
        Next &raquo;
      </button>
    </nav>
  `,
})
export class PaginationComponent {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (current > 3) pages.push(-1); // ellipsis

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push(-1); // ellipsis
    pages.push(total);

    return pages;
  });
}
