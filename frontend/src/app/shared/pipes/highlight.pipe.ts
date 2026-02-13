import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'highlight', standalone: true })
export class HighlightPipe implements PipeTransform {
  transform(text: string, searchTerm: string): string {
    if (!searchTerm || !text) return text;

    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  }
}
