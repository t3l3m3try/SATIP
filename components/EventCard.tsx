import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, ShieldAlert, Globe, Crosshair, FileText } from "lucide-react";
import Link from "next/link";
import { getCountryName, getCountrySlug } from "@/lib/country-utils";
import { createSlug } from "@/lib/threat-data";

interface ArticleData {
    title: string;
    date: string;
    threat_actor: string;
    attribution_country: string;
    targeted_countries: string;
    targeted_sectors: string;
    risk_score: number;
    summary: string;
    what: string;
    when: string;
    where: string;
    who: string;
    why: string;
    how: string;
    so_what: string;
    what_is_next: string;
    url: string;
}

interface EventCardProps {
    article: ArticleData;
}

export function EventCard({ article }: EventCardProps) {
    const countryList = article.targeted_countries ? article.targeted_countries.split(',').map(c => c.trim()).filter(Boolean) : [];
    const sectorList = article.targeted_sectors ? article.targeted_sectors.split(',').map(s => s.trim()).filter(Boolean) : [];

    const getRiskColor = (score: number) => {
        if (score >= 80) return "text-red-500 border-red-500/50 bg-red-500/10";
        if (score >= 50) return "text-orange-500 border-orange-500/50 bg-orange-500/10";
        return "text-green-500 border-green-500/50 bg-green-500/10";
    };

    return (
        <Card className="flex flex-col h-full border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all hover:bg-card/80 group overflow-hidden">
            <CardHeader className="pb-3 border-b border-white/5 bg-black/20">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={`${getRiskColor(article.risk_score)} font-mono`}>
                                RISK: {article.risk_score}/100
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span className="font-mono">{article.date}</span>
                            </div>
                        </div>
                        <CardTitle className="text-xl font-bold text-secondary group-hover:text-primary transition-colors leading-tight">
                            {article.title || "Untitled Intelligence Event"}
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-6 pt-6">

                {/* Executive Summary */}
                <div className="space-y-3 bg-pink-500/5 p-4 rounded-lg border border-pink-500/10">
                    <div className="space-y-1">
                        <span className="text-xs uppercase text-pink-500 font-semibold flex items-center gap-2">
                            <FileText className="h-3 w-3" /> Executive Summary
                        </span>
                        <p className="text-sm text-foreground/80 italic">{article.summary}</p>
                    </div>
                </div>

                {/* 5Ws + H Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                        <span className="text-xs uppercase text-muted-foreground font-semibold">Who?</span>
                        <p className="text-foreground/90">{article.who}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs uppercase text-muted-foreground font-semibold">What?</span>
                        <p className="text-foreground/90">{article.what}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs uppercase text-muted-foreground font-semibold">When?</span>
                        <p className="text-foreground/90">{article.when}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs uppercase text-muted-foreground font-semibold">Where?</span>
                        <p className="text-foreground/90">{article.where}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs uppercase text-muted-foreground font-semibold">Why?</span>
                        <p className="text-foreground/90">{article.why}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs uppercase text-muted-foreground font-semibold">How?</span>
                        <p className="text-foreground/90">{article.how}</p>
                    </div>
                </div>

                {/* Analysis Section */}
                <div className="space-y-3 bg-secondary/5 p-4 rounded-lg border border-secondary/10">
                    <div className="space-y-1">
                        <span className="text-xs uppercase text-secondary font-semibold flex items-center gap-2">
                            <ShieldAlert className="h-3 w-3" /> So What?
                        </span>
                        <p className="text-sm text-foreground/80 italic">{article.so_what}</p>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-secondary/10">
                        <span className="text-xs uppercase text-secondary font-semibold flex items-center gap-2">
                            What is Next?
                        </span>
                        <p className="text-sm text-foreground/80 italic">{article.what_is_next}</p>
                    </div>
                </div>

                {/* Tags Section */}
                <div className="space-y-3 mt-auto">
                    {/* Threat Actor */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs uppercase text-muted-foreground font-semibold">Actor:</span>
                        <Link href={`/threat-actors/${createSlug(article.threat_actor)}`}>
                            <Badge variant="outline" className="cursor-pointer hover:bg-primary/20 text-primary border-primary/30">
                                {article.threat_actor}
                            </Badge>
                        </Link>
                        {article.attribution_country && (
                            <Badge variant="outline" className="text-[10px] uppercase border-muted-foreground/30 text-muted-foreground">
                                Origin: {article.attribution_country}
                            </Badge>
                        )}
                    </div>

                    {/* Sectors */}
                    {sectorList.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1">
                                <Crosshair className="h-3 w-3" /> Sectors
                            </span>
                            {sectorList.map((sector, idx) => (
                                <Link key={idx} href={`/sectors/${createSlug(sector)}`}>
                                    <Badge variant="secondary" className="text-[10px] bg-secondary/10 text-foreground border-secondary/20 hover:bg-secondary/20 cursor-pointer transition-colors">
                                        {sector}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Countries */}
                    {countryList.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs uppercase text-muted-foreground font-semibold flex items-center gap-1">
                                <Globe className="h-3 w-3" /> Targets
                            </span>
                            {countryList.map((code) => (
                                <Link
                                    key={code}
                                    href={`/countries/${getCountrySlug(code)}`}
                                    title={getCountryName(code)}
                                >
                                    <Badge variant="secondary" className="text-[10px] bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 transition-colors cursor-pointer">
                                        {code}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-2 pb-4 border-t border-white/5 bg-black/20 flex justify-end">
                <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                    <ExternalLink className="h-3 w-3" />
                    Source Analysis
                </a>
            </CardFooter>
        </Card>
    );
}
