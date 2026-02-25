import { NextResponse } from 'next/server';
import { ArticleService } from '@/lib/article-service';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const slug = (await params).slug;

    try {
        const article = ArticleService.getArticleBySlug(slug);

        if (!article) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        return NextResponse.json(article);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
