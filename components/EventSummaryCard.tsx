import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ShieldAlert, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ArticleWithSlug } from "@/lib/article-service";

interface EventSummaryCardProps {
    article: ArticleWithSlug;
}

export function EventSummaryCard({ article }: EventSummaryCardProps) {
    const getRiskColor = (score: number) => {
        if (score >= 80) return "text-red-500 border-red-500/50 bg-red-500/10";
        if (score >= 50) return "text-orange-500 border-orange-500/50 bg-orange-500/10";
        return "text-green-500 border-green-500/50 bg-green-500/10";
    };

    return (
        <Link href={`/events/${article.slug}`} className="block group h-full">
            <Card className="flex flex-col h-full border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all hover:bg-card/80 overflow-hidden">
                <CardHeader className="pb-3 border-b border-white/5 bg-black/20">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Badge variant="outline" className={`${getRiskColor(article.risk_score)} font-mono text-[10px]`}>
                                RISK: {article.risk_score}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span className="font-mono">{article.date}</span>
                            </div>
                        </div>
                        <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-2">
                            {article.title || "Untitled Intelligence Event"}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-secondary">{article.threat_actor}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {article.summary}
                    </p>
                </CardContent>
                <CardFooter className="pt-2 pb-4 border-t border-white/5 bg-black/20 flex justify-between items-center text-xs text-muted-foreground font-mono">
                    <span>View Analysis</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform text-primary" />
                </CardFooter>
            </Card>
        </Link>
    );
}
