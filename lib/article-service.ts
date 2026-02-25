import { CSVStore, Article } from './csv-store';
import { createSlug as createBaseSlug } from './threat-data';

export interface ArticleWithSlug extends Article {
    slug: string;
}

export class ArticleService {
    static getArticles(): ArticleWithSlug[] {
        const articles = CSVStore.getArticles();
        return articles.map(article => ({
            ...article,
            slug: this.generateSlug(article)
        }));
    }

    static getArticleBySlug(slug: string): ArticleWithSlug | undefined {
        const articles = this.getArticles();
        return articles.find(a => a.slug === slug);
    }

    private static generateSlug(article: Article): string {
        // Create a slug from date and title to ensure some uniqueness
        // Fallback to threat actor if title is missing (legacy data support)
        const title = article.title || "";
        const threatActor = article.threat_actor || "unknown-actor";
        const summary = article.summary || "";
        const base = title || `${threatActor}-${summary.substring(0, 20)}`;
        const date = article.date || "no-date";
        return `${date}-${createBaseSlug(base)}`;
    }
}
