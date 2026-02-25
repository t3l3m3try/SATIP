
"use client";

import { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Globe, Shield, FileText } from "lucide-react";
import { findThreatActorProfile, createSlug, ThreatProfile } from "@/lib/threat-data";

interface ArticleData {
    date: string;
    threat_actor: string;
    attribution_country: string;
    targeted_countries: string;
    summary: string;
    url: string;
    title: string;
}

interface CountryData {
    Country: string;
    "Alpha-2": string;
    "Alpha-3": string;
}

export default function CountryProfilePage({ params }: { params: Promise<{ alpha2: string }> }) {
    const { alpha2: rawAlpha2 } = use(params);
    const alpha2 = rawAlpha2.toUpperCase();

    const [articles, setArticles] = useState<ArticleData[]>([]);
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [allThreatActors, setAllThreatActors] = useState<ThreatProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/data')
            .then(res => res.json())
            .then(data => {
                if (data.articles) setArticles(data.articles);
                if (data.countries) setCountries(data.countries);
                if (data.threat_actors) setAllThreatActors(data.threat_actors);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load data", err);
                setLoading(false);
            });
    }, []);

    const countryInfo = useMemo(() => {
        return countries.find(c => c["Alpha-2"] === alpha2);
    }, [countries, alpha2]);

    const countryArticles = useMemo(() => {
        return articles
            .filter(a => a.targeted_countries.split(',').map(s => s.trim().toUpperCase()).includes(alpha2))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [articles, alpha2]);

    const threatActors = useMemo(() => {
        const actors = new Set(countryArticles.map(a => a.threat_actor).filter(Boolean));
        return Array.from(actors);
    }, [countryArticles]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-primary font-mono animate-pulse">SYNCHRONIZING WITH GLOBAL DATABASES...</div>
            </div>
        );
    }

    if (!countryInfo && articles.length > 0 && countryArticles.length === 0) {
        // If we have data but no articles for this country, it might not exist in our data
        // but let's check if the alpha2 is valid at least in our country list
        const exists = countries.some(c => c["Alpha-2"] === alpha2);
        if (!exists) notFound();
    }

    const countryName = countryInfo?.Country || `Country (${alpha2})`;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <Link href="/" className="flex items-center text-muted-foreground hover:text-primary transition-colors mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>

            <div className="border-b border-primary/30 pb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground glow-text tracking-wide uppercase">
                            {countryName}
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm mt-1">Strategic Region Report: {alpha2}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{countryArticles.length}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-tighter">Total Hits Recorded</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Threat Actors */}
                <div className="space-y-6">
                    <Card className="border-l-4 border-l-secondary">
                        <CardHeader>
                            <CardTitle className="uppercase tracking-wider text-sm text-secondary flex items-center">
                                <Shield className="mr-2 h-4 w-4" /> Threat Actors Involved
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {threatActors.map(actor => {
                                    const profile = findThreatActorProfile(allThreatActors, actor);
                                    return (
                                        <div key={actor} className="p-3 bg-background/30 rounded border border-border/50 hover:border-secondary/50 transition-all">
                                            {profile ? (
                                                <Link
                                                    href={`/threat-actors/${createSlug(profile.name)}`}
                                                    className="text-foreground font-bold hover:text-secondary hover:underline transition-colors block"
                                                >
                                                    {actor}
                                                </Link>
                                            ) : (
                                                <span className="text-foreground font-bold">{actor}</span>
                                            )}
                                        </div>
                                    );
                                })}
                                {threatActors.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">No known threat actors identified for this region.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/10 border-none">
                        <CardContent className="pt-6">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4">Regional Statistics</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-border/50 pb-2">
                                    <span className="text-xs text-muted-foreground uppercase">Unique Actors</span>
                                    <span className="text-lg font-bold text-secondary">{threatActors.length}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-border/50 pb-2">
                                    <span className="text-xs text-muted-foreground uppercase">Confirmed Events</span>
                                    <span className="text-lg font-bold text-primary">{countryArticles.length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Recent Intel */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-l-4 border-l-primary h-full">
                        <CardHeader>
                            <CardTitle className="uppercase tracking-wider text-sm text-primary flex items-center">
                                <FileText className="mr-2 h-4 w-4" /> Recent Intelligence
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[800px] overflow-y-auto custom-scrollbar pr-2">
                                {countryArticles.map((article, i) => (
                                    <div key={i} className="bg-background/50 p-4 rounded border border-border/50 space-y-2 group hover:border-primary/30 transition-all">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="font-mono text-primary">{article.date}</span>
                                            </div>
                                            {(() => {
                                                const profile = findThreatActorProfile(allThreatActors, article.threat_actor);
                                                return profile ? (
                                                    <Link href={`/threat-actors/${createSlug(profile.name)}`}>
                                                        <span className="text-xs border border-primary/30 text-primary px-2 py-0.5 rounded hover:bg-primary/10 cursor-pointer transition-colors block w-fit ml-auto">
                                                            <Shield className="w-3 h-3 inline mr-1" />
                                                            {article.threat_actor}
                                                        </span>
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs border border-primary/30 text-primary px-2 py-0.5 rounded block w-fit ml-auto">
                                                        <Shield className="w-3 h-3 inline mr-1" />
                                                        {article.threat_actor}
                                                    </span>
                                                );
                                            })()}
                                        </div>

                                        <h4 className="font-bold text-foreground text-sm mb-1">
                                            <Link
                                                href={`/events/${article.date}-${createSlug(article.title)}`}
                                                className="hover:text-primary hover:underline transition-colors"
                                            >
                                                {article.title}
                                            </Link>
                                        </h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {article.summary}
                                        </p>
                                    </div>
                                ))}
                                {countryArticles.length === 0 && (
                                    <div className="text-center py-12">
                                        <Shield className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                        <p className="text-muted-foreground">No recent intelligence reports for this sector.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
