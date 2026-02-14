import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

export interface BilingualContent {
  contentVi: string;
  contentEn: string;
  textVi: string;
  textEn: string;
}

export class WordService {
  private dataDir: string;
  private fileIndex: Map<string, string> = new Map();

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  async buildFileIndex(): Promise<void> {
    logger.info(`Building file index from: ${this.dataDir}`);
    await this.scanDirectory(this.dataDir);
    logger.info(`Indexed ${this.fileIndex.size} documents`);
  }

  private async scanDirectory(dirPath: string): Promise<void> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (entry.name.endsWith('.docx')) {
        const baseName = path.basename(entry.name, '.docx');
        this.fileIndex.set(this.normalizeForMatch(baseName), fullPath);
      }
    }
  }

  private normalizeForMatch(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u00C0-\u024F\u1E00-\u1EFF-]/g, '');
  }

  findFile(slug: string, titleVi?: string): string | undefined {
    const normalizedSlug = this.normalizeForMatch(slug);
    if (this.fileIndex.has(normalizedSlug)) {
      return this.fileIndex.get(normalizedSlug);
    }

    if (titleVi) {
      const normalizedTitle = this.normalizeForMatch(titleVi);
      if (this.fileIndex.has(normalizedTitle)) {
        return this.fileIndex.get(normalizedTitle);
      }
    }

    for (const [key, filePath] of this.fileIndex) {
      if (key.includes(normalizedSlug) || normalizedSlug.includes(key)) {
        return filePath;
      }
    }

    return undefined;
  }

  async parseBilingualFile(slug: string, titleVi?: string): Promise<BilingualContent> {
    const filePath = this.findFile(slug, titleVi);
    if (!filePath) {
      logger.warn(`File not found for slug: ${slug}`);
      return {
        contentVi: '<p>Nội dung không có sẵn</p>',
        contentEn: '<p>Content unavailable</p>',
        textVi: '',
        textEn: '',
      };
    }

    try {
      const buffer = await fs.promises.readFile(filePath);
      const text = buffer.toString('utf-8');
      return this.splitBilingualContent(text);
    } catch (err) {
      logger.error(`Error parsing file ${filePath}: ${(err as Error).message}`);
      return {
        contentVi: '<p>Nội dung không có sẵn</p>',
        contentEn: '<p>Content unavailable</p>',
        textVi: '',
        textEn: '',
      };
    }
  }

  private splitBilingualContent(fullText: string): BilingualContent {
    // Find the English section separator: a line starting with "Article:" after blank lines
    const englishSectionRegex = /\n\s*\n\s*\n\s*Article:\s*.+\n/;
    const match = fullText.match(englishSectionRegex);

    let viSection: string;
    let enSection: string;

    if (match && match.index !== undefined) {
      viSection = fullText.substring(0, match.index).trim();
      enSection = fullText.substring(match.index).trim();
    } else {
      // Fallback: try splitting on "Article:" at line start
      const fallbackIdx = fullText.search(/^Article:\s/m);
      if (fallbackIdx > 0) {
        viSection = fullText.substring(0, fallbackIdx).trim();
        enSection = fullText.substring(fallbackIdx).trim();
      } else {
        // No English section found
        viSection = fullText.trim();
        enSection = '';
      }
    }

    const textVi = this.extractBodyText(viSection, 'vi');
    const textEn = this.extractBodyText(enSection, 'en');

    return {
      contentVi: this.textToHtml(textVi),
      contentEn: enSection ? this.textToHtml(textEn) : '<p>English content unavailable</p>',
      textVi,
      textEn,
    };
  }

  private extractBodyText(section: string, lang: 'vi' | 'en'): string {
    if (!section) return '';

    // For Vietnamese: body starts after "Bài viết:" marker
    // For English: body starts after "Content:" marker
    const bodyMarker = lang === 'vi'
      ? /\n\s*Bài viết:\s*\n/i
      : /\n\s*Content:\s*\n/i;

    const match = section.match(bodyMarker);
    if (match && match.index !== undefined) {
      let body = section.substring(match.index + match[0].length).trim();
      // Remove trailing references section [1], [2], etc.
      const refsIdx = body.search(/\n\s*\[\d+\]\s/);
      if (refsIdx > 0) {
        body = body.substring(0, refsIdx).trim();
      }
      return body;
    }

    // Fallback: try "Description:" marker and use everything after
    const descMarker = /\n\s*Description:\s*\n/i;
    const descMatch = section.match(descMarker);
    if (descMatch && descMatch.index !== undefined) {
      return section.substring(descMatch.index + descMatch[0].length).trim();
    }

    return section;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private textToHtml(text: string): string {
    if (!text) return '';
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    return paragraphs
      .map(p => `<p>${this.escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
      .join('\n');
  }
}
