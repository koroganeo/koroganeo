import mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

export class WordService {
  private dataDir: string;
  private fileIndex: Map<string, string> = new Map(); // normalized name -> full path

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  async buildFileIndex(): Promise<void> {
    logger.info(`Building file index from: ${this.dataDir}`);
    await this.scanDirectory(this.dataDir);
    logger.info(`Indexed ${this.fileIndex.size} Word documents`);
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
    // Try direct slug match
    const normalizedSlug = this.normalizeForMatch(slug);
    if (this.fileIndex.has(normalizedSlug)) {
      return this.fileIndex.get(normalizedSlug);
    }

    // Try titleVi match
    if (titleVi) {
      const normalizedTitle = this.normalizeForMatch(titleVi);
      if (this.fileIndex.has(normalizedTitle)) {
        return this.fileIndex.get(normalizedTitle);
      }
    }

    // Try partial match on slug
    for (const [key, filePath] of this.fileIndex) {
      if (key.includes(normalizedSlug) || normalizedSlug.includes(key)) {
        return filePath;
      }
    }

    return undefined;
  }

  async parseWordFile(slug: string, titleVi?: string): Promise<string> {
    const filePath = this.findFile(slug, titleVi);
    if (!filePath) {
      logger.warn(`Word file not found for slug: ${slug}`);
      return '<p>Content unavailable</p>';
    }

    try {
      const buffer = await fs.promises.readFile(filePath);
      const result = await mammoth.convertToHtml({ buffer });

      if (result.messages.length > 0) {
        result.messages.forEach(msg => {
          logger.debug(`mammoth [${msg.type}]: ${msg.message}`);
        });
      }

      return result.value || '<p>Content unavailable</p>';
    } catch (err) {
      logger.error(`Error parsing Word file ${filePath}: ${(err as Error).message}`);
      return '<p>Content unavailable</p>';
    }
  }

  async parseWordFileAsText(slug: string, titleVi?: string): Promise<string> {
    const filePath = this.findFile(slug, titleVi);
    if (!filePath) {
      return '';
    }

    try {
      const buffer = await fs.promises.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (err) {
      logger.error(`Error extracting text from ${filePath}: ${(err as Error).message}`);
      return '';
    }
  }
}
