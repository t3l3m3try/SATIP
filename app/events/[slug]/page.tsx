"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleWithSlug } from "@/lib/article-service";
import { EventCard } from "@/components/EventCard";
import { ArrowLeft } from "lucide-react";

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [article, setArticle] = useState<ArticleWithSlug | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/articles/${slug}`)
            .then(res => {
                if (!res.ok) throw new Error("Article not found");
                return res.json();
            })
            .then(data => {
                setArticle(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setArticle(null);
                setLoading(false);
            });
    }, [slug]);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading intelligence event...</div>;
    }

    if (!article) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Link href="/events" className="flex items-center text-muted-foreground hover:text-primary transition-colors mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Intelligence Log
            </Link>

            <div className="h-full">
                <EventCard article={article} />
            </div>
        </div>
    );
}
