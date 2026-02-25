"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WorldMap } from "@/components/dashboard/WorldMap";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Shield, Globe, FileText, Calendar, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import Papa from "papaparse";
import { Article, Country } from "@/lib/csv-store";
import { A2_TO_NUMERIC, NUMERIC_TO_A2 } from "@/lib/country-mapping";
import { findThreatActorProfile, createSlug, ThreatProfile } from "@/lib/threat-data";
import Link from "next/link";

import { TimelineWave } from "@/components/dashboard/TimelineWave";

// Re-define interfaces for client-side
interface ArticleData {
  date: string;
  threat_actor: string;
  attribution_country: string;
  targeted_countries: string;
  targeted_sectors: string;
  summary: string;
  url: string;
}

interface CountryData {
  Country: string;
  "Alpha-2": string;
  "Alpha-3": string;
}

export default function DashboardPage() {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [threatActors, setThreatActors] = useState<ThreatProfile[]>([]);
  // selectedCountry will store the Map ID (Numeric string, e.g. "356" for India)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        if (data.articles) setArticles(data.articles);
        if (data.countries) setCountries(data.countries);
        if (data.threat_actors) setThreatActors(data.threat_actors);
      })
      .catch(err => console.error("Failed to load data", err));
  }, []);

  // Filter Data
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const articleDate = new Date(article.date);

      // Date range filter
      if (dateFromFilter) {
        const fromDate = new Date(dateFromFilter);
        if (articleDate < fromDate) return false;
      }
      if (dateToFilter) {
        const toDate = new Date(dateToFilter);
        if (articleDate > toDate) return false;
      }

      // Year filter
      if (yearFilter && !article.date.startsWith(yearFilter)) return false;

      // Search Query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          article.summary?.toLowerCase().includes(query) ||
          article.threat_actor?.toLowerCase().includes(query) ||
          article.targeted_countries?.toLowerCase().includes(query) ||
          article.targeted_sectors?.toLowerCase().includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [articles, dateFromFilter, dateToFilter, yearFilter, searchQuery]);

  // Aggregations
  const stats = useMemo(() => {
    const actors = new Set(filteredArticles.map(a => a.threat_actor).filter(Boolean));
    const uniqueCountries = new Set();
    filteredArticles.forEach(a => {
      a.targeted_countries.split(',').forEach(c => {
        const clean = c.trim().toUpperCase();
        if (clean) uniqueCountries.add(clean);
      });
    });

    return {
      actors: actors.size,
      countries: uniqueCountries.size,
      events: filteredArticles.length
    };
  }, [filteredArticles]);

  const mapData = useMemo(() => {
    // Map of NumericID -> Count
    const counts: { [key: string]: number } = {};

    filteredArticles.forEach(a => {
      // Split by comma and handle potential extra spaces
      const targets = a.targeted_countries.split(',').map(s => s.trim().toUpperCase());

      targets.forEach(code => {
        // Clean code (Alpha-2)
        let cleanCode = code.replace(/[^A-Z]/g, '');

        // Map to Numeric using our local utility
        const numId = A2_TO_NUMERIC[cleanCode];

        if (numId) {
          // Ensure ID is string to match map keys
          counts[numId] = (counts[numId] || 0) + 1;
        }
      });
    });
    return counts;
  }, [filteredArticles]);

  // Top 5 Actors
  const topActors = useMemo(() => {
    const actorCounts: { [key: string]: number } = {};
    filteredArticles.forEach(a => {
      const actor = a.threat_actor;
      if (actor && actor !== 'Multiple' && actor !== 'Unknown') {
        actorCounts[actor] = (actorCounts[actor] || 0) + 1;
      }
    });
    return Object.entries(actorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredArticles]);

  // Build a Map for O(1) country lookups (replaces O(n) .find() on every code)
  const countryMap = useMemo(() => {
    const m = new Map<string, CountryData>();
    countries.forEach(c => m.set(c["Alpha-2"], c));
    return m;
  }, [countries]);

  // Shared country hit-counts (alpha2 → count). Used by both topCountries and allCountriesSorted.
  const countryCountsByAlpha2 = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredArticles.forEach(a => {
      a.targeted_countries.split(',').forEach(s => {
        const code = s.trim().toUpperCase().replace(/[^A-Z]/g, '');
        if (code) counts[code] = (counts[code] || 0) + 1;
      });
    });
    return counts;
  }, [filteredArticles]);

  // Top 5 Targeted Countries
  const topCountries = useMemo(() => {
    return Object.entries(countryCountsByAlpha2)
      .map(([alpha2, count]) => ({
        alpha2: alpha2.toLowerCase(),
        name: countryMap.get(alpha2)?.Country ?? alpha2,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [countryCountsByAlpha2, countryMap]);

  // Top 5 Targeted Sectors
  const topSectors = useMemo(() => {
    const sectorCounts: { [key: string]: number } = {};
    filteredArticles.forEach(a => {
      if (a.targeted_sectors) {
        const sectors = a.targeted_sectors.split(',').map(s => s.trim());
        sectors.forEach(sector => {
          if (sector) {
            sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(sectorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredArticles]);

  // All Countries sorted by hits (for Countries section) — derived from shared countryCountsByAlpha2
  const allCountriesSorted = useMemo(() => {
    return Object.entries(countryCountsByAlpha2)
      .map(([alpha2, hits]) => ({
        alpha2,
        name: countryMap.get(alpha2)?.Country ?? alpha2,
        hits
      }))
      .sort((a, b) => b.hits - a.hits);
  }, [countryCountsByAlpha2, countryMap]);


  // Selected Country Details logic
  const selectedCountryDetails = useMemo(() => {
    if (!selectedCountry) return null;

    // selectedCountry is Numeric ID. Convert to Alpha-2 to find in our countries list.
    const alpha2 = NUMERIC_TO_A2[selectedCountry];
    if (!alpha2) return null;

    const cObj = countries.find(c => c["Alpha-2"] === alpha2);
    // If not found in list (e.g. unknown country), construct a basic object
    const name = cObj?.Country || `Country (${alpha2})`;

    const related = filteredArticles.filter(a =>
      a.targeted_countries.split(',').map(s => s.trim().toUpperCase()).includes(alpha2)
    );

    // Sort articles by date descending (most recent first)
    const sortedRelated = related.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Get actors targeting this country
    const actorsInCountry = Array.from(new Set(related.map(a => a.threat_actor)));

    return {
      alpha2: alpha2.toLowerCase(),
      name: name,
      articles: sortedRelated,
      actors: actorsInCountry
    };
  }, [selectedCountry, filteredArticles, countries]);

  // Timeline Data
  const timelineData = useMemo(() => {
    const counts: { [key: string]: number } = {};

    filteredArticles.forEach(a => {
      try {
        const date = new Date(a.date);
        if (!isNaN(date.getTime())) {
          const key = format(date, "yyyy"); // Group by Year
          counts[key] = (counts[key] || 0) + 1;
        }
      } catch (e) {
        // ignore invalid dates
      }
    });

    // Sort chronologically
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }, [filteredArticles]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-primary/30 pb-4">
        <h1 className="text-3xl font-bold text-foreground tracking-widest uppercase glow-text">
          Global Threat Map <span className="text-primary text-sm align-top">v2.0</span>
        </h1>
        <div className="flex gap-4">
          <div className="flex items-center space-x-2 bg-card p-2 rounded border border-border">
            <span className="text-xs text-muted-foreground uppercase">Year</span>
            <Input
              type="number"
              placeholder="YYYY"
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="w-24 h-8 bg-background border-none text-right"
            />
          </div>
          <div className="flex items-center space-x-2 bg-card p-2 rounded border border-border">
            <span className="text-xs text-muted-foreground uppercase">From</span>
            <Input
              type="date"
              value={dateFromFilter}
              onChange={e => setDateFromFilter(e.target.value)}
              className="h-8 bg-background border-none"
            />
          </div>
          <div className="flex items-center space-x-2 bg-card p-2 rounded border border-border">
            <span className="text-xs text-muted-foreground uppercase">To</span>
            <Input
              type="date"
              value={dateToFilter}
              onChange={e => setDateToFilter(e.target.value)}
              className="h-8 bg-background border-none"
            />
          </div>
          <div className="flex items-center space-x-2 bg-card p-2 rounded border border-border">
            <span className="text-xs text-muted-foreground uppercase">Search</span>
            <Input
              type="text"
              placeholder="Keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-48 h-8 bg-background border-none"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/events">
          <StatsCard title="Recorded Events" value={stats.events} icon={Globe} className="border-accent/50 shadow-[0_0_10px_oklch(var(--accent)/20%)] hover:bg-accent/10 transition-colors cursor-pointer h-full" />
        </Link>
        <Link href="/threat-actors">
          <StatsCard title="Active Threat Actors" value={stats.actors} icon={Shield} className="border-primary/50 shadow-[0_0_10px_oklch(var(--primary)/20%)] hover:bg-primary/10 transition-colors cursor-pointer h-full" />
        </Link>
        <Link href="/countries">
          <StatsCard title="Targeted Countries" value={stats.countries} icon={MapPin} className="border-secondary/50 shadow-[0_0_10px_oklch(var(--secondary)/20%)] hover:bg-secondary/10 transition-colors cursor-pointer h-full" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">
        {/* Main Content Area: Map + Timeline */}
        <div className="lg:col-span-3 space-y-8">
          {/* Map */}
          <Card className="h-[500px] border-primary/20 bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle className="text-primary uppercase tracking-wider flex items-center">
                <Globe className="mr-2 h-4 w-4" /> Threat Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-grow relative">
              <WorldMap
                data={mapData}
                onCountryClick={setSelectedCountry}
                countryMapping={{}}
              />
            </CardContent>
          </Card>

          {/* Timeline */}
          <TimelineWave data={timelineData} title="Event Timeline (Yearly)" />
        </div>

        {/* Side Panels: Top Lists and Details */}
        <div className="space-y-6">

          {/* Selected Country Details */}
          <Card className={`border-l-4 ${selectedCountryDetails ? 'border-l-primary' : 'border-l-muted'} transition-all`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase text-muted-foreground">Target Focus</CardTitle>
              <div className="text-xl font-bold text-foreground">
                {selectedCountryDetails ? (
                  <Link href={`/countries/${selectedCountryDetails.alpha2}`} className="hover:text-primary hover:underline transition-colors">
                    {selectedCountryDetails.name}
                  </Link>
                ) : (
                  "Select Country Region"
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedCountryDetails ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs uppercase text-muted-foreground">Active Actors</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedCountryDetails.actors.map(actor => {
                        const profile = findThreatActorProfile(threatActors, actor);
                        return profile ? (
                          <Link key={actor} href={`/threat-actors/${createSlug(profile.name)}`} className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded border border-destructive/30 hover:bg-destructive/30 transition-colors">
                            {actor}
                          </Link>
                        ) : (
                          <span key={actor} className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded border border-destructive/30">
                            {actor}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    <span className="text-xs uppercase text-muted-foreground sticky top-0 bg-card z-10 block mb-2">Recent Intel</span>
                    {selectedCountryDetails.articles.map((article, i) => (
                      <div key={i} className="bg-background/50 p-2 rounded border border-border text-xs">
                        <div className="flex justify-between text-muted-foreground mb-1">
                          <span>{article.date}</span>
                          <a href={article.url} target="_blank" className="text-primary hover:underline">LINK</a>
                        </div>
                        <div className="text-foreground font-medium mb-1">
                          {(() => {
                            const profile = findThreatActorProfile(threatActors, article.threat_actor);
                            return profile ? (
                              <Link href={`/threat-actors/${createSlug(profile.name)}`} className="hover:text-primary hover:underline transition-colors">
                                {article.threat_actor}
                              </Link>
                            ) : article.threat_actor;
                          })()}
                        </div>
                        <div className="text-muted-foreground italic truncate">{article.summary}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Interact with the map to visualize specific threat vectors and intelligence reports.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top 5 Actors */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase text-secondary">Top Threat Actors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topActors.map(([actor, count], i) => {
                const profile = findThreatActorProfile(threatActors, actor);
                const content = (
                  <div className="flex justify-between items-center text-sm p-2 bg-background/30 rounded border border-border/50 hover:border-secondary/50 hover:bg-secondary/10 transition-all cursor-pointer">
                    <span className="font-mono text-foreground flex items-center">
                      <span className="text-xs text-muted-foreground w-4 mr-2">{i + 1}.</span>
                      {actor}
                    </span>
                    <span className="text-xs font-bold bg-secondary/20 text-secondary px-2 py-0.5 rounded">{count}</span>
                  </div>
                );
                return profile ? (
                  <Link key={actor} href={`/threat-actors/${createSlug(profile.name)}`}>
                    {content}
                  </Link>
                ) : (
                  <div key={actor}>{content}</div>
                );
              })}
              {topActors.length === 0 && <span className="text-xs text-muted-foreground">No data available</span>}
            </CardContent>
          </Card>

          {/* Top 5 Countries */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase text-accent">Top Targeted Countries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topCountries.map(({ name, count, alpha2 }, i) => (
                <Link
                  key={alpha2}
                  href={`/countries/${alpha2}`}
                  className="flex justify-between items-center text-sm p-2 bg-background/30 rounded border border-border/50 hover:border-accent/50 hover:bg-accent/10 transition-all cursor-pointer"
                >
                  <span className="font-mono text-foreground flex items-center">
                    <span className="text-xs text-muted-foreground w-4 mr-2">{i + 1}.</span>
                    {name}
                  </span>
                  <span className="text-xs font-bold bg-accent/20 text-accent px-2 py-0.5 rounded">{count}</span>
                </Link>
              ))}
              {topCountries.length === 0 && <span className="text-xs text-muted-foreground">No data available</span>}
            </CardContent>
          </Card>

          {/* Top 5 Sectors */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase text-primary">Top Targeted Sectors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topSectors.map(([sector, count], i) => {
                // Create slug for sector
                const slug = createSlug(sector);

                return (
                  <Link
                    key={sector}
                    href={`/sectors/${slug}`}
                    className="flex justify-between items-center text-sm p-2 bg-background/30 rounded border border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all cursor-pointer"
                  >
                    <span className="font-mono text-foreground flex items-center">
                      <span className="text-xs text-muted-foreground w-4 mr-2">{i + 1}.</span>
                      {sector}
                    </span>
                    <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded">{count}</span>
                  </Link>
                );
              })}
              {topSectors.length === 0 && <span className="text-xs text-muted-foreground">No data available</span>}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
