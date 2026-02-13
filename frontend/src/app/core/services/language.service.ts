import { Injectable, signal, effect } from '@angular/core';

export type Language = 'vi' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  current = signal<Language>(this.getStored());

  constructor() {
    effect(() => {
      const lang = this.current();
      localStorage.setItem('lang', lang);
      document.documentElement.lang = lang;
    });
  }

  toggle(): void {
    this.current.update(lang => (lang === 'vi' ? 'en' : 'vi'));
  }

  private getStored(): Language {
    const stored = localStorage.getItem('lang');
    return stored === 'en' ? 'en' : 'vi';
  }
}
