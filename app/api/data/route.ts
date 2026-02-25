
import { NextResponse } from 'next/server';
import { ArticleService } from '@/lib/article-service';
import { CSVStore } from '@/lib/csv-store';
import { ThreatActorService } from '@/lib/threat-actor-service';

export async function GET() {
    try {
        const articles = ArticleService.getArticles();
        const countries = CSVStore.getCountries();
        const threat_actors = ThreatActorService.getThreatActors();
        return NextResponse.json({ articles, countries, threat_actors });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
