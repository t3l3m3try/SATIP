
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Globe, MapPin, TrendingUp, Shield, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

interface ArticleData {
    targeted_countries: string;
}

interface CountryData {
    Country: string;
    "Alpha-2": string;
    "Alpha-3": string;
}

export default function CountriesListPage() {
    const [articles, setArticles] = useState<ArticleData[]>([]);
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetch('/api/data')
            .then(res => res.json())
            .then(data => {
                if (data.articles) setArticles(data.articles);
                if (data.countries) setCountries(data.countries);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load data", err);
                setLoading(false);
            });
    }, []);

    const countriesWithHits = useMemo(() => {
        const countryCounts: { [key: string]: number } = {};
        articles.forEach(a => {
            const targets = a.targeted_countries.split(',').map(s => s.trim().toUpperCase());
            targets.forEach(code => {
                let cleanCode = code.replace(/[^A-Z]/g, '');
                if (cleanCode) {
                    countryCounts[cleanCode] = (countryCounts[cleanCode] || 0) + 1;
                }
            });
        });

        return Object.entries(countryCounts)
            .map(([alpha2, count]) => {
                const countryObj = countries.find(c => c["Alpha-2"] === alpha2);
                return {
                    alpha2,
                    name: countryObj?.Country || `Country (${alpha2})`,
                    hits: count
                };
            })
            .sort((a, b) => b.hits - a.hits)
            .filter(country =>
                country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                country.alpha2.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [articles, countries, searchTerm]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-primary font-mono animate-pulse uppercase tracking-widest">Scanning Global Regions...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="border-b border-primary/30 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-widest uppercase glow-text">
                        Targeted Countries
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm mt-1">Targeted Countries Falsh Cards</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search countries..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="pl-8 bg-card border-secondary/20 focus:border-secondary"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {countriesWithHits.map((country, i) => (
                    <Link key={country.alpha2} href={`/countries/${country.alpha2.toLowerCase()}`}>
                        <Card className="h-full border border-primary/20 bg-card/40 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer group">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 rounded bg-primary/10 text-primary mb-2 group-hover:scale-110 transition-transform">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground">RANK #{i + 1}</span>
                                </div>
                                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors truncate">
                                    {country.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center text-muted-foreground">
                                        <TrendingUp className="h-4 w-4 mr-1" />
                                        <span>Intel Hits</span>
                                    </div>
                                    <span className="text-xl font-bold text-primary tabular-nums">{country.hits}</span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-primary/10 flex justify-between items-center text-[10px] uppercase tracking-tighter text-muted-foreground">
                                    <span>Sector ID: {country.alpha2}</span>
                                    <span className="text-primary group-hover:underline">View Intelligence Profile →</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {countriesWithHits.length === 0 && (
                <div className="text-center py-20 border border-dashed border-border rounded-lg bg-muted/5">
                    <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">No Regional Data Found</h3>
                    <p className="text-sm text-muted-foreground mt-2">The global threat landscape appears currently quiet in our database.</p>
                </div>
            )}
        </div>
    );
}
