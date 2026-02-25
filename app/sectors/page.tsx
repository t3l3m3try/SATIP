"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SectorProfile } from "@/lib/sector-service";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search, Crosshair, Activity, Calendar } from "lucide-react";

export default function SectorsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [sectors, setSectors] = useState<SectorProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/sectors')
            .then(res => res.json())
            .then(data => {
                setSectors(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load sectors", err);
                setLoading(false);
            });
    }, []);

    const filteredSectors = sectors.filter(sector =>
        sector.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/30 pb-4">
                <h1 className="text-3xl font-bold text-foreground tracking-widest uppercase glow-text flex items-center">
                    <Crosshair className="mr-3 h-8 w-8 text-secondary" />
                    Targeted Sectors Database
                </h1>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search sectors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 bg-card border-secondary/20 focus:border-secondary"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && (
                    <div className="col-span-full text-center py-12 text-muted-foreground animate-pulse">
                        Loading Sectors Data...
                    </div>
                )}

                {!loading && filteredSectors.map((sector) => (
                    <Link href={`/sectors/${sector.slug}`} key={sector.name} className="block group">
                        <Card className="h-full border-border/40 hover:border-secondary/50 transition-all hover:bg-card/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-bold text-foreground group-hover:text-secondary transition-colors flex justify-between items-start">
                                    <span>{sector.name}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2 text-xs">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Activity className="h-3 w-3" />
                                        <span>{sector.event_count} {sector.event_count === 1 ? 'event' : 'events'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        <span>Last seen: {sector.last_seen || "N/A"}</span>
                                    </div>
                                    {sector.top_threat_actors.length > 0 && (
                                        <div className="mt-2">
                                            <span className="text-muted-foreground text-xs">Top Threats: </span>
                                            <span className="text-secondary text-xs">
                                                {sector.top_threat_actors.map(t => t.name).slice(0, 3).join(", ")}
                                                {sector.top_threat_actors.length > 3 ? "..." : ""}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {!loading && filteredSectors.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No sectors found matching "{searchTerm}"
                </div>
            )}
        </div>
    );
}
