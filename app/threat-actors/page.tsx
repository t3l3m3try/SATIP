"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createSlug, ThreatProfile } from "@/lib/threat-data";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search, ShieldAlert, Activity, Calendar } from "lucide-react";

export default function ThreatActorsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [actors, setActors] = useState<ThreatProfile[]>([]);

    useEffect(() => {
        fetch('/api/threat-actors')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setActors(data);
                } else {
                    console.error("API returned non-array data:", data);
                    setActors([]);
                }
            })
            .catch(err => {
                console.error("Failed to load threat actors", err);
                setActors([]);
            });
    }, []);

    const filteredActors = actors.filter(actor => {
        const term = searchTerm.toLowerCase();
        return (
            actor.name.toLowerCase().includes(term) ||
            actor.attribution_country.toLowerCase().includes(term)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/30 pb-4">
                <h1 className="text-3xl font-bold text-foreground tracking-widest uppercase glow-text flex items-center">
                    <ShieldAlert className="mr-3 h-8 w-8 text-destructive" />
                    Threat Actor Database
                </h1>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search actors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 bg-card border-secondary/20 focus:border-secondary"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActors.map((actor) => (
                    <Link href={`/threat-actors/${createSlug(actor.name)}`} key={actor.name} className="block group">
                        <Card className="h-full border-border/40 hover:border-primary/50 transition-all hover:bg-card/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex justify-between items-start">
                                    <span>{actor.name}</span>
                                    {actor.attribution_country && (
                                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border/50 font-mono tracking-tighter uppercase whitespace-nowrap ml-2">
                                            {actor.attribution_country}
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2 text-xs">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Activity className="h-3 w-3" />
                                        <span>{actor.event_count} {actor.event_count === 1 ? 'event' : 'events'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        <span>Last seen: {actor.last_seen}</span>
                                    </div>
                                    {actor.all_targeted_countries.length > 0 && (
                                        <div className="mt-2">
                                            <span className="text-muted-foreground text-xs">Targets: </span>
                                            <span className="text-secondary text-xs">
                                                {actor.all_targeted_countries.slice(0, 5).join(", ")}
                                                {actor.all_targeted_countries.length > 5 ? "..." : ""}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {filteredActors.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No threat actors found matching "{searchTerm}"
                </div>
            )}
        </div>
    );
}
