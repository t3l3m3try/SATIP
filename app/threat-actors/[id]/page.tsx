"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getThreatActorBySlug, getTargetedCountriesWithHits, ThreatProfile } from "@/lib/threat-data";
import { getCountryName, getCountrySlug } from "@/lib/country-utils";
import { createSlug } from "@/lib/threat-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, Calendar, ExternalLink, MapPin, Activity, Crosshair } from "lucide-react";

export default function ThreatActorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [actor, setActor] = useState<ThreatProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/threat-actors')
            .then(res => res.json())
            .then((data: ThreatProfile[]) => {
                const found = getThreatActorBySlug(data, id);
                setActor(found || null);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading threat actor data...</div>;
    }

    if (!actor) {
        notFound();
    }

    const targetedCountriesWithHits = getTargetedCountriesWithHits([actor], actor.name).slice(0, 5);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <Link href="/threat-actors" className="flex items-center text-muted-foreground hover:text-primary transition-colors mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Database
            </Link>

            <div className="border-b border-primary/30 pb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h1 className="text-4xl font-bold text-foreground glow-text tracking-wide">{actor.name}</h1>
                    {actor.attribution_country && (
                        <Badge variant="outline" className="text-lg py-1 px-4 border-primary text-primary bg-primary/10">
                            <Globe className="w-4 h-4 mr-2" />
                            {actor.attribution_country}
                        </Badge>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span className="font-semibold">{actor.event_count}</span> {actor.event_count === 1 ? 'event' : 'events'}
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>First seen: <span className="font-semibold">{actor.first_seen}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Last seen: <span className="font-semibold">{actor.last_seen}</span></span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Recent Intel */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-l-4 border-l-accent/70 h-full">
                        <CardHeader>
                            <CardTitle className="uppercase tracking-wider text-sm text-accent flex items-center">
                                <Activity className="mr-2 h-4 w-4" /> Recent Intel
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {actor.events.map((event, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg border border-border/40 bg-card/30 hover:bg-card/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            <span className="font-mono">{event.date}</span>
                                        </div>
                                        {event.targeted_countries.length > 0 && (
                                            <div className="flex flex-wrap gap-1 justify-end">
                                                {event.targeted_countries.map(country => (
                                                    <Link
                                                        key={country}
                                                        href={`/countries/${getCountrySlug(country)}`}
                                                    >
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20 cursor-pointer transition-colors"
                                                        >
                                                            {getCountryName(country)}
                                                        </Badge>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Link href={`/events/${event.slug}`} className="block group/link">
                                        <h4 className="text-lg font-bold text-foreground mb-2 group-hover/link:text-primary transition-colors">
                                            {event.title}
                                        </h4>
                                    </Link>
                                    <p className="text-foreground/90 leading-relaxed mb-3 text-sm">{event.summary}</p>
                                    <div className="flex justify-end">
                                        <a
                                            href={event.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Source
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Targeted Info */}
                <div className="space-y-6">
                    {/* Targeted Countries */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="uppercase tracking-wider text-sm text-secondary flex items-center">
                                <MapPin className="mr-2 h-4 w-4" /> Top Targeted Countries
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {targetedCountriesWithHits.length > 0 ? (
                                <div className="space-y-2">
                                    {targetedCountriesWithHits.map(({ country, hits }) => (
                                        <Link
                                            key={country}
                                            href={`/countries/${getCountrySlug(country)}`}
                                        >
                                            <div className="flex items-center justify-between p-2 rounded bg-secondary/5 border border-secondary/10 hover:bg-secondary/10 transition-colors cursor-pointer">
                                                <span className="text-sm font-medium text-foreground">{getCountryName(country)}</span>
                                                <Badge variant="outline" className="bg-secondary/20 text-secondary border-secondary/30 text-xs">
                                                    {hits} {hits === 1 ? 'hit' : 'hits'}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm italic">No targeted countries recorded</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Targeted Sectors */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="uppercase tracking-wider text-sm text-secondary flex items-center">
                                <Crosshair className="mr-2 h-4 w-4" /> Top Targeted Sectors
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {actor.top_sectors && actor.top_sectors.length > 0 ? (
                                <div className="space-y-2">
                                    {actor.top_sectors.map(({ name, count }) => (
                                        <Link
                                            key={name}
                                            href={`/sectors/${createSlug(name)}`}
                                        >
                                            <div className="flex items-center justify-between p-2 rounded bg-secondary/5 border border-secondary/10 hover:bg-secondary/10 transition-colors cursor-pointer">
                                                <span className="text-sm font-medium text-foreground">{name}</span>
                                                <Badge variant="outline" className="bg-secondary/20 text-secondary border-secondary/30 text-xs">
                                                    {count} {count === 1 ? 'hit' : 'hits'}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm italic">No targeted sectors recorded</p>
                            )}
                        </CardContent>
                    </Card>


                </div>
            </div>
        </div>
    );
}
