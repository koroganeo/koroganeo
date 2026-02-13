import mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

// ZIP/DOCX magic bytes: PK\x03\x04
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

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

  private async isRealDocx(buffer: Buffer): Promise<boolean> {
    return buffer.length >= 4 && buffer.subarray(0, 4).equals(ZIP_MAGIC);
  }

  private parsePlainTextToHtml(text: string): string {
    // Split into metadata header and article body at "Bài viết:" marker
    const bodyMarker = /\n\s*Bài viết:\s*\n/i;
    const match = text.match(bodyMarker);

    let body: string;
    if (match && match.index !== undefined) {
      body = text.substring(match.index + match[0].length).trim();
    } else {
      // No marker found — try splitting after "Description:" block
      const descMarker = /\n\s*Description:\s*\n/i;
      const descMatch = text.match(descMarker);
      if (descMatch && descMatch.index !== undefined) {
        body = text.substring(descMatch.index + descMatch[0].length).trim();
      } else {
        // Fallback: use everything after the header lines
        body = text.trim();
      }
    }

    // Convert plain text paragraphs to HTML
    const paragraphs = body.split(/\n\s*\n/).filter(p => p.trim());
    return paragraphs.map(p => `<p>${this.escapeHtml(p.trim())}</p>`).join('\n');
  }

  private parsePlainTextBody(text: string): string {
    const bodyMarker = /\n\s*Bài viết:\s*\n/i;
    const match = text.match(bodyMarker);

    if (match && match.index !== undefined) {
      return text.substring(match.index + match[0].length).trim();
    }

    const descMarker = /\n\s*Description:\s*\n/i;
    const descMatch = text.match(descMarker);
    if (descMatch && descMatch.index !== undefined) {
      return text.substring(descMatch.index + descMatch[0].length).trim();
    }

    return text.trim();
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async parseWordFile(slug: string, titleVi?: string): Promise<string> {
    const filePath = this.findFile(slug, titleVi);
    if (!filePath) {
      logger.warn(`Word file not found for slug: ${slug}`);
      return '<p>Content unavailable</p>';
    }

    try {
      const buffer = await fs.promises.readFile(filePath);

      if (await this.isRealDocx(buffer)) {
        const result = await mammoth.convertToHtml({ buffer });
        if (result.messages.length > 0) {
          result.messages.forEach(msg => {
            logger.debug(`mammoth [${msg.type}]: ${msg.message}`);
          });
        }
        return result.value || '<p>Content unavailable</p>';
      }

      // Plain-text file with .docx extension
      const text = buffer.toString('utf-8');
      return this.parsePlainTextToHtml(text);
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

      if (await this.isRealDocx(buffer)) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      }

      // Plain-text file with .docx extension
      const text = buffer.toString('utf-8');
      return this.parsePlainTextBody(text);
    } catch (err) {
      logger.error(`Error extracting text from ${filePath}: ${(err as Error).message}`);
      return '';
    }
  }
}
