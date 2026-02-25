import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const DATA_DIR = path.join(process.cwd(), 'data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.csv');
const COUNTRIES_FILE = path.join(DATA_DIR, 'Countries.csv');

// In-memory cache with TTL (30 seconds) so the CSV is not re-parsed on every request.
// This is safe because article ingestion is an explicit user action.
const CACHE_TTL_MS = 30_000;

interface Cache<T> {
    data: T;
    expiresAt: number;
}

let articlesCache: Cache<Article[]> | null = null;
let countriesCache: Cache<Country[]> | null = null;

export interface Article {
    date: string;
    threat_actor: string;
    attribution_country: string;
    targeted_countries: string; // Comma separated alpha-2 codes
    targeted_sectors: string; // Comma separated
    title: string;
    summary: string; // "What?" covers this, but summary is good for quick view
    risk_score: number; // 0-100
    what: string;
    when: string;
    where: string;
    who: string;
    why: string;
    how: string;
    so_what: string;
    what_is_next: string;
    url: string;
}

export interface Country {
    Country: string;
    "Alpha-2": string;
    "Alpha-3": string;
}

export class CSVStore {
    static ensureDataDir() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    }

    static getArticles(): Article[] {
        const now = Date.now();
        if (articlesCache && now < articlesCache.expiresAt) {
            return articlesCache.data;
        }
        if (!fs.existsSync(ARTICLES_FILE)) {
            return [];
        }
        const fileContent = fs.readFileSync(ARTICLES_FILE, 'utf-8');
        const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
        const data = parsed.data as Article[];
        articlesCache = { data, expiresAt: now + CACHE_TTL_MS };
        return data;
    }

    /** Call after writing a new article so the next request sees fresh data. */
    static invalidateCache() {
        articlesCache = null;
        countriesCache = null;
    }

    static addArticle(article: Article) {
        this.ensureDataDir();
        const articles = this.getArticles();
        articles.push(article);
        const csv = Papa.unparse(articles);
        fs.writeFileSync(ARTICLES_FILE, csv);
        this.invalidateCache(); // bust cache so next read is fresh
    }

    static normalizeUrl(url: string): string {
        try {
            // Remove fragment (#...)
            let normalized = url.split('#')[0];
            // Remove trailing slash if present
            if (normalized.endsWith('/')) {
                normalized = normalized.slice(0, -1);
            }
            return normalized.toLowerCase().trim();
        } catch (e) {
            return url.toLowerCase().trim();
        }
    }

    static articleExists(url: string): boolean {
        const articles = this.getArticles();
        const targetNormalized = this.normalizeUrl(url);
        return articles.some(a => this.normalizeUrl(a.url) === targetNormalized);
    }

    static getCountries(): Country[] {
        const now = Date.now();
        if (countriesCache && now < countriesCache.expiresAt) {
            return countriesCache.data;
        }
        if (!fs.existsSync(COUNTRIES_FILE)) {
            return [];
        }
        const fileContent = fs.readFileSync(COUNTRIES_FILE, 'utf-8');
        // The country csv uses semicolon delimiter based on viewing it earlier
        const parsed = Papa.parse(fileContent, { header: true, delimiter: ';', skipEmptyLines: true });
        const data = parsed.data as Country[];
        countriesCache = { data, expiresAt: now + CACHE_TTL_MS };
        return data;
    }
}

