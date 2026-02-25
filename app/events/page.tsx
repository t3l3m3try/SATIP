"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EventSummaryCard } from "@/components/EventSummaryCard";
import { ArticleWithSlug } from "@/lib/article-service";

export default function EventsPage() {
    const [articles, setArticles] = useState<ArticleWithSlug[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/data')
            .then(res => res.json())
            .then(data => {
                if (data.articles) {
                    // Sorting logic handled here or backend? Keeping it consistent.
                    const sorted = data.articles.sort((a: ArticleWithSlug, b: ArticleWithSlug) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setArticles(sorted);
                }
            })
            .catch(err => console.error("Failed to load data", err))
            .finally(() => setLoading(false));
    }, []);

    const filteredArticles = articles.filter(article =>
        (article.title && article.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (article.threat_actor && article.threat_actor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (article.summary && article.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (article.targeted_countries && article.targeted_countries.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="border-b border-primary/30 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-widest uppercase glow-text">
                        Intelligence Log
                    </h1>
                    <p className="text-muted-foreground font-mono text-sm mt-1">Archive of recorded threat events</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 bg-card border-secondary/20 focus:border-secondary"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading && (
                    <div className="col-span-full text-center py-12 text-muted-foreground animate-pulse">
                        Loading Intelligence Data...
                    </div>
                )}

                {!loading && filteredArticles.length > 0 ? (
                    filteredArticles.map((article, i) => (
                        <EventSummaryCard key={i} article={article} />
                    ))
                ) : (
                    !loading && (
                        <div className="col-span-full text-center py-12 text-muted-foreground italic">
                            No intelligence events found matching your criteria.
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
