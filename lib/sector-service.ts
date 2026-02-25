import { CSVStore } from './csv-store';
import { createSlug } from './threat-data';

export interface SectorEvent {
    date: string;
    threat_actor: string;
    title: string;
    summary: string;
    url: string;
    targeted_countries: string[];
}

export interface SectorProfile {
    name: string;
    slug: string;
    events: SectorEvent[];
    event_count: number;
    last_seen: string; // ISO date string
    top_threat_actors: { name: string; count: number }[];
}

export class SectorService {
    static getSectors(): SectorProfile[] {
        const articles = CSVStore.getArticles();
        const sectorMap = new Map<string, SectorEvent[]>();

        for (const article of articles) {
            if (!article.targeted_sectors) continue;

            const sectors = article.targeted_sectors.split(',').map(s => s.trim()).filter(Boolean);

            for (const sector of sectors) {
                if (!sectorMap.has(sector)) {
                    sectorMap.set(sector, []);
                }

                sectorMap.get(sector)?.push({
                    date: article.date,
                    threat_actor: article.threat_actor,
                    title: article.title || "Untitled",
                    summary: article.summary,
                    url: article.url,
                    targeted_countries: article.targeted_countries ? article.targeted_countries.split(',').map(c => c.trim()).filter(Boolean) : []
                });
            }
        }

        const profiles: SectorProfile[] = [];

        for (const [name, events] of sectorMap.entries()) {
            // Sort events by date descending
            events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Calculate aggregated stats
            const lastSeen = events.length > 0 ? events[0].date : "";

            // Top threat actors
            const actorCounts = new Map<string, number>();
            events.forEach(e => {
                const actor = e.threat_actor || "Unknown";
                actorCounts.set(actor, (actorCounts.get(actor) || 0) + 1);
            });

            const top_threat_actors = Array.from(actorCounts.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            profiles.push({
                name,
                slug: createSlug(name),
                events,
                event_count: events.length,
                last_seen: lastSeen,
                top_threat_actors
            });
        }

        // Sort sectors by event count (descending), then by name
        return profiles.sort((a, b) => {
            if (b.event_count !== a.event_count) {
                return b.event_count - a.event_count;
            }
            return a.name.localeCompare(b.name);
        });
    }

    static getSectorBySlug(slug: string): SectorProfile | undefined {
        const sectors = this.getSectors();
        return sectors.find(s => s.slug === slug);
    }
}
