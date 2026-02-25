import { ArticleService } from './article-service';

export interface ThreatActorEvent {
    date: string;
    targeted_countries: string[];
    summary: string;
    url: string;
    title: string;
    slug: string;
}

export interface ThreatProfile {
    name: string;
    attribution_country: string;
    events: ThreatActorEvent[];
    all_targeted_countries: string[];
    top_sectors: { name: string; count: number }[];
    first_seen: string;
    last_seen: string;
    event_count: number;
}

function parseTargetedCountries(countriesStr: string): string[] {
    if (!countriesStr || countriesStr.trim() === '') {
        return [];
    }
    // Split by comma and trim whitespace
    return countriesStr.split(',').map(c => c.trim()).filter(c => c.length > 0);
}

function parseTargetedSectors(sectorsStr: string): string[] {
    if (!sectorsStr || sectorsStr.trim() === '') {
        return [];
    }
    return sectorsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

export class ThreatActorService {
    static getThreatActors(): ThreatProfile[] {
        const records = ArticleService.getArticles();

        // Group by threat actor
        const actorMap = new Map<string, {
            attribution_country: string;
            events: ThreatActorEvent[];
            all_countries: Set<string>;
            sector_counts: Map<string, number>;
        }>();

        for (const record of records) {
            // Defensive programming: Ensure fields exist and are strings
            const actorName = (record.threat_actor || "").trim();

            if (!actorName) {
                continue;
            }

            const targetedCountries = parseTargetedCountries(record.targeted_countries || "");
            const targetedSectors = parseTargetedSectors(record.targeted_sectors || "");

            const event: ThreatActorEvent = {
                date: record.date || "",
                targeted_countries: targetedCountries,
                summary: record.summary || "",
                url: record.url || "",
                title: record.title || "Untitled",
                slug: record.slug || "",
            };

            if (!actorMap.has(actorName)) {
                actorMap.set(actorName, {
                    attribution_country: record.attribution_country || '',
                    events: [],
                    all_countries: new Set(),
                    sector_counts: new Map(),
                });
            }

            const actor = actorMap.get(actorName)!;
            actor.events.push(event);

            // Add targeted countries to the set
            targetedCountries.forEach(country => actor.all_countries.add(country));

            // Count sectors
            targetedSectors.forEach(sector => {
                const count = actor.sector_counts.get(sector) || 0;
                actor.sector_counts.set(sector, count + 1);
            });

            // Update attribution country if it was empty and we have one now
            if (!actor.attribution_country && record.attribution_country) {
                actor.attribution_country = record.attribution_country;
            }
        }

        // Convert to final structure
        const threatActors: ThreatProfile[] = [];

        for (const [name, data] of actorMap.entries()) {
            // Sort events by date (most recent first)
            data.events.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB.getTime() - dateA.getTime();
            });

            // Get first and last seen dates
            const validDates = data.events
                .map(e => new Date(e.date))
                .filter(d => !isNaN(d.getTime()));

            let firstSeenStr = "Unknown";
            let lastSeenStr = "Unknown";

            if (validDates.length > 0) {
                const lastSeen = new Date(Math.max(...validDates.map(d => d.getTime())));
                const firstSeen = new Date(Math.min(...validDates.map(d => d.getTime())));
                firstSeenStr = firstSeen.toISOString().split('T')[0];
                lastSeenStr = lastSeen.toISOString().split('T')[0];
            }

            // Process top sectors
            const topSectors = Array.from(data.sector_counts.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            threatActors.push({
                name,
                attribution_country: data.attribution_country,
                events: data.events,
                all_targeted_countries: Array.from(data.all_countries).sort(),
                top_sectors: topSectors,
                first_seen: firstSeenStr,
                last_seen: lastSeenStr,
                event_count: data.events.length,
            });
        }

        // Sort threat actors by name
        threatActors.sort((a, b) => a.name.localeCompare(b.name));

        return threatActors;
    }
}
