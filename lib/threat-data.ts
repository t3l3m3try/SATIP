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
    first_seen: string;
    last_seen: string;
    event_count: number;
    top_sectors: { name: string; count: number }[];
}

export const getThreatActorBySlug = (profiles: ThreatProfile[], slug: string): ThreatProfile | undefined => {
    return profiles.find(p => createSlug(p.name) === slug);
};

export const findThreatActorProfile = (profiles: ThreatProfile[], name: string): ThreatProfile | undefined => {
    const normalizedName = name.toLowerCase().trim();
    return profiles.find(p =>
        p.name.toLowerCase() === normalizedName
    );
};

export const getEventsByThreatActor = (profiles: ThreatProfile[], name: string): ThreatActorEvent[] => {
    const profile = findThreatActorProfile(profiles, name);
    return profile?.events || [];
};

export const getTargetedCountries = (profiles: ThreatProfile[], name: string): string[] => {
    const profile = findThreatActorProfile(profiles, name);
    return profile?.all_targeted_countries || [];
};

// Get targeted countries with hit count
export const getTargetedCountriesWithHits = (profiles: ThreatProfile[], name: string): Array<{ country: string; hits: number }> => {
    const profile = findThreatActorProfile(profiles, name);
    if (!profile) return [];

    const countryHits = new Map<string, number>();

    profile.events.forEach(event => {
        event.targeted_countries.forEach(country => {
            countryHits.set(country, (countryHits.get(country) || 0) + 1);
        });
    });

    return Array.from(countryHits.entries())
        .map(([country, hits]) => ({ country, hits }))
        .sort((a, b) => b.hits - a.hits);
};

export const createSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};
