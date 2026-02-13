import { Component, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="bg-slate-800 text-slate-300 py-8 mt-12">
      <div class="container mx-auto px-4 text-center text-sm">
        <p>{{ languageService.current() === 'vi'
          ? 'MonsterBox - Nền tảng bài viết đa ngôn ngữ'
          : 'MonsterBox - Bilingual Article Platform' }}</p>
        <p class="mt-2 text-slate-500">&copy; {{ currentYear }} MonsterBox</p>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  languageService = inject(LanguageService);
  currentYear = new Date().getFullYear();
}
