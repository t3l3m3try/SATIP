"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectorProfile, SectorService } from "@/lib/sector-service";
import { getCountryName, getCountrySlug } from "@/lib/country-utils";
import { createSlug } from "@/lib/threat-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, Calendar, ExternalLink, ShieldAlert, Activity, Crosshair } from "lucide-react";

export default function SectorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [sector, setSector] = useState<SectorProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/sectors')
            .then(res => res.json())
            .then((data: SectorProfile[]) => {
                const found = data.find(s => s.slug === slug);
                setSector(found || null);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [slug]);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading sector data...</div>;
    }

    if (!sector) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <Link href="/sectors" className="flex items-center text-muted-foreground hover:text-primary transition-colors mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sectors
            </Link>

            <div className="border-b border-secondary/30 pb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h1 className="text-4xl font-bold text-foreground glow-text tracking-wide flex items-center gap-3">
                        <Crosshair className="h-8 w-8 text-secondary" />
                        {sector.name}
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span className="font-semibold">{sector.event_count}</span> {sector.event_count === 1 ? 'event' : 'events'}
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Last seen: <span className="font-semibold">{sector.last_seen || "N/A"}</span></span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Recent Intel */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-l-4 border-l-secondary/70">
                        <CardHeader>
                            <CardTitle className="uppercase tracking-wider text-sm text-secondary flex items-center">
                                <Activity className="mr-2 h-4 w-4" /> Recent Intel
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sector.events.map((event, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg border border-border/40 bg-card/30 hover:bg-card/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            <span className="font-mono">{event.date}</span>
                                        </div>
                                        <Link href={`/threat-actors/${createSlug(event.threat_actor)}`}>
                                            <Badge variant="outline" className="text-xs border-primary/30 text-primary hover:bg-primary/10 cursor-pointer">
                                                <ShieldAlert className="w-3 h-3 mr-1" />
                                                {event.threat_actor}
                                            </Badge>
                                        </Link>
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground mb-1">
                                        <Link href={`/events/${event.date}-${createSlug(event.title)}`} className="hover:underline hover:text-secondary transition-colors">
                                            {event.title}
                                        </Link>
                                    </h4>
                                    <p className="text-foreground/80 leading-relaxed mb-3 text-sm">{event.summary}</p>

                                    {event.targeted_countries.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {event.targeted_countries.map(country => (
                                                <Link
                                                    key={country}
                                                    href={`/countries/${getCountrySlug(country)}`}
                                                >
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20 cursor-pointer transition-colors"
                                                    >
                                                        {getCountryName(country)}
                                                    </Badge>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-3 flex justify-end">
                                        <a
                                            href={event.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            View Source
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Top Threat Actors */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="uppercase tracking-wider text-sm text-destructive flex items-center">
                                <ShieldAlert className="mr-2 h-4 w-4" /> Top Threats
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {sector.top_threat_actors.length > 0 ? (
                                <div className="space-y-2">
                                    {sector.top_threat_actors.map(({ name, count }) => (
                                        <Link
                                            key={name}
                                            href={`/threat-actors/${createSlug(name)}`}
                                        >
                                            <div className="flex items-center justify-between p-2 rounded bg-destructive/5 border border-destructive/10 hover:bg-destructive/10 transition-colors cursor-pointer">
                                                <span className="text-sm font-medium text-foreground">{name}</span>
                                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                                                    {count} {count === 1 ? 'event' : 'events'}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm italic">No threat actors recorded</p>
                            )}
                        </CardContent>
                    </Card>


                </div>
            </div>
        </div>
    );
}
