import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'vietnameseDate', standalone: true })
export class VietnameseDatePipe implements PipeTransform {
  transform(value: string | Date, lang: 'vi' | 'en' = 'vi', format: 'short' | 'long' = 'long'): string {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    if (lang === 'vi') {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      if (format === 'short') {
        return `${day}/${month}/${year}`;
      }
      return `${day} tháng ${month}, ${year}`;
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: format === 'short' ? 'short' : 'long',
      day: 'numeric',
    });
  }
}
