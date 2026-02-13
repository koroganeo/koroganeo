import ExcelJS from 'exceljs';
import { ArticleMetadata } from '../models/article.interface';
import { excelColumnMap } from '../config/excel.config';
import { logger } from '../utils/logger';

export class ExcelService {
  private metadata: Map<string, ArticleMetadata> = new Map();
  private allMetadataList: ArticleMetadata[] = [];

  async loadMetadata(filePath: string): Promise<void> {
    logger.info(`Loading metadata from: ${filePath}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];

    if (!sheet) {
      throw new Error('No worksheet found in Excel file');
    }

    let loaded = 0;
    let skipped = 0;

    sheet.eachRow((row, index) => {
      if (index === 1) return; // Skip header

      try {
        const rawSlug = this.getCellString(row.getCell(excelColumnMap.slug));
        const titleVi = this.getCellString(row.getCell(excelColumnMap.titleVi));

        if (!titleVi && !rawSlug) {
          skipped++;
          return;
        }

        const metadata: ArticleMetadata = {
          genres: this.getCellString(row.getCell(excelColumnMap.genres)),
          titleVi,
          titleEn: this.getCellString(row.getCell(excelColumnMap.titleEn)),
          tags: this.parseArray(this.getCellString(row.getCell(excelColumnMap.tags))),
          slug: this.extractSlugKey(rawSlug, titleVi),
          page: this.getCellNumber(row.getCell(excelColumnMap.page)),
          difficultyLevel: this.getCellString(row.getCell(excelColumnMap.difficultyLevel)),
          creators: this.parseArray(this.getCellString(row.getCell(excelColumnMap.creators))),
          createdAt: this.parseDate(row.getCell(excelColumnMap.createdAt).value),
          crawlStatus: this.getCellString(row.getCell(excelColumnMap.crawlStatus)),
          length: this.getCellNumber(row.getCell(excelColumnMap.length)),
        };

        this.metadata.set(metadata.slug, metadata);
        this.allMetadataList.push(metadata);
        loaded++;
      } catch (err) {
        logger.warn(`Skipping row ${index}: ${(err as Error).message}`);
        skipped++;
      }
    });

    logger.info(`Loaded ${loaded} articles, skipped ${skipped} rows`);
  }

  getMetadata(slug: string): ArticleMetadata | undefined {
    return this.metadata.get(slug);
  }

  getAllMetadata(): ArticleMetadata[] {
    return this.allMetadataList;
  }

  getMetadataMap(): Map<string, ArticleMetadata> {
    return this.metadata;
  }

  private getCellString(cell: ExcelJS.Cell): string {
    const value = cell.value;
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      const obj = value as unknown as Record<string, unknown>;
      if ('text' in obj && typeof obj.text === 'string') {
        return obj.text.trim();
      }
      if ('richText' in obj && Array.isArray(obj.richText)) {
        return (obj.richText as Array<{ text: string }>).map(r => r.text).join('').trim();
      }
      return String(value).trim();
    }
    return String(value).trim();
  }

  private getCellNumber(cell: ExcelJS.Cell): number {
    const value = cell.value;
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  private parseArray(value: string): string[] {
    if (!value || value === '[]' || value === 'nan') return [];
    try {
      // Handle "['item1', 'item2']" format
      const cleaned = value.replace(/'/g, '"');
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
    } catch {
      // Fallback: treat as comma-separated
      return value
        .replace(/[\[\]']/g, '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }
  }

  private extractSlugKey(slug: string, titleVi: string): string {
    if (slug) {
      // Extract last segment from URL
      const parts = slug.replace(/\/$/, '').split('/');
      const lastPart = parts[parts.length - 1] || '';
      if (lastPart) return lastPart;
    }
    // Fallback to titleVi-based slug
    return titleVi
      .replace(/\s+/g, '-')
      .replace(/[^\w\u00C0-\u024F\u1E00-\u1EFF-]/g, '')
      .toLowerCase();
  }

  private parseDate(value: ExcelJS.CellValue): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    if (typeof value === 'number') {
      // Excel serial date number
      const date = new Date((value - 25569) * 86400 * 1000);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    return new Date();
  }
}
