
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";

type InputMode = "url" | "text" | "bulk";

interface BulkResult {
    url: string;
    status: "pending" | "processing" | "success" | "error" | "duplicate";
    error?: string;
    data?: any;
}

export default function AddArticlePage() {
    const [mode, setMode] = useState<InputMode>("url");
    const [url, setUrl] = useState("");
    const [textContent, setTextContent] = useState("");
    const [bulkUrls, setBulkUrls] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "scraping" | "extracting" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [result, setResult] = useState<any>(null);

    // Bulk processing state
    const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [currentBulkIndex, setCurrentBulkIndex] = useState(0);

    const processSingleUrl = async (urlToProcess: string): Promise<{ success: boolean; error?: string; data?: any }> => {
        try {
            // Step 1: Scrape
            const scrapeRes = await fetch("/api/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlToProcess }),
            });

            if (!scrapeRes.ok) {
                const errorText = await scrapeRes.text();
                return { success: false, error: errorText };
            }
            const scrapeData = await scrapeRes.json();

            if (scrapeData.error) {
                return { success: false, error: scrapeData.error };
            }

            // Step 2: Extract
            const extractRes = await fetch("/api/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: scrapeData.content,
                    url: urlToProcess,
                    filepath: scrapeData.filepath
                }),
            });

            if (!extractRes.ok) {
                const errorText = await extractRes.text();
                return { success: false, error: errorText };
            }
            const extractData = await extractRes.json();

            if (extractData.error) {
                return { success: false, error: extractData.error };
            }

            if (extractData.success === false) {
                return { success: false, error: extractData.message || "Operation failed" };
            }

            return { success: true, data: extractData.data };
        } catch (err: any) {
            return { success: false, error: err.message || "Unknown error" };
        }
    };

    const handleBulkSubmit = async () => {
        const urls = bulkUrls
            .split('\n')
            .map(u => u.trim())
            .filter(u => u.length > 0);

        if (urls.length === 0) return;

        setBulkProcessing(true);
        const results: BulkResult[] = urls.map(url => ({ url, status: "pending" }));
        setBulkResults(results);

        for (let i = 0; i < urls.length; i++) {
            setCurrentBulkIndex(i);

            // Update status to processing
            setBulkResults(prev => prev.map((r, idx) =>
                idx === i ? { ...r, status: "processing" } : r
            ));

            const currentUrl = urls[i];

            // VALIDATION: Block PDF files
            if (currentUrl.toLowerCase().endsWith(".pdf")) {
                setBulkResults(prev => prev.map((r, idx) =>
                    idx === i ? { ...r, status: "error", error: "PDF files are not supported." } : r
                ));
                continue; // Skip processing
            }

            const result = await processSingleUrl(currentUrl);

            // Update with result
            setBulkResults(prev => prev.map((r, idx) => {
                if (idx === i) {
                    if (result.success) {
                        return { ...r, status: "success", data: result.data };
                    } else {
                        // Check if it's a duplicate error
                        const isDuplicate = result.error?.includes("already exists");
                        return {
                            ...r,
                            status: isDuplicate ? "duplicate" : "error",
                            error: result.error
                        };
                    }
                }
                return r;
            }));
        }

        setBulkProcessing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === "url" && !url) return;
        if (mode === "text" && !textContent) return;
        if (mode === "bulk") {
            handleBulkSubmit();
            return;
        }

        setLoading(true);
        setErrorMsg("");
        setResult(null);

        try {
            if (mode === "url") {
                // VALIDATION: Block PDF files
                if (url.toLowerCase().endsWith(".pdf")) {
                    throw new Error("PDF files are not supported. Please use text content mode for PDFs.");
                }

                // URL Mode: Scrape then Extract
                setStatus("scraping");
                const scrapeRes = await fetch("/api/scrape", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                });

                if (!scrapeRes.ok) {
                    throw new Error(await scrapeRes.text());
                }
                const scrapeData = await scrapeRes.json();

                if (scrapeData.error) throw new Error(scrapeData.error);

                // Step 2: Extract
                setStatus("extracting");
                const extractRes = await fetch("/api/extract", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: scrapeData.content,
                        url: url,
                        filepath: scrapeData.filepath
                    }),
                });

                if (!extractRes.ok) {
                    throw new Error(await extractRes.text());
                }
                const extractData = await extractRes.json();

                if (extractData.error) throw new Error(extractData.error);

                if (extractData.success === false) {
                    throw new Error(extractData.message || "Extraction failed");
                }

                setResult(extractData.data);
                setStatus("success");
            } else {
                // Text Mode: Direct Extract
                setStatus("extracting");
                const extractRes = await fetch("/api/extract", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: textContent,
                        url: url || "manual-submission",
                        filepath: null
                    }),
                });

                if (!extractRes.ok) {
                    throw new Error(await extractRes.text());
                }
                const extractData = await extractRes.json();

                if (extractData.error) throw new Error(extractData.error);

                if (extractData.success === false) {
                    throw new Error(extractData.message || "Extraction failed");
                }

                setResult(extractData.data);
                setStatus("success");
            }

        } catch (err: any) {
            console.error(err);
            setStatus("error");
            setErrorMsg(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const bulkSummary = bulkResults.length > 0 ? {
        total: bulkResults.length,
        success: bulkResults.filter(r => r.status === "success").length,
        error: bulkResults.filter(r => r.status === "error").length,
        duplicate: bulkResults.filter(r => r.status === "duplicate").length,
    } : null;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="border-b border-primary/30 pb-4">
                <h1 className="text-3xl font-bold text-foreground tracking-widest uppercase glow-text">
                    Inject Intelligence
                </h1>
                <p className="text-muted-foreground font-mono text-sm mt-1">Manual source ingestion protocol</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-card/30 rounded-lg border border-border w-fit">
                <button
                    onClick={() => setMode("url")}
                    className={`px-4 py-2 rounded font-mono text-sm transition-all ${mode === "url"
                        ? "bg-primary text-primary-foreground shadow-[0_0_10px_oklch(var(--primary)/30%)]"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    URL SCRAPING
                </button>
                <button
                    onClick={() => setMode("text")}
                    className={`px-4 py-2 rounded font-mono text-sm transition-all ${mode === "text"
                        ? "bg-primary text-primary-foreground shadow-[0_0_10px_oklch(var(--primary)/30%)]"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    DIRECT TEXT
                </button>
                <button
                    onClick={() => setMode("bulk")}
                    className={`px-4 py-2 rounded font-mono text-sm transition-all ${mode === "bulk"
                        ? "bg-primary text-primary-foreground shadow-[0_0_10px_oklch(var(--primary)/30%)]"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    BULK URLS
                </button>
            </div>

            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-primary uppercase tracking-wider flex items-center">
                        <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
                        {mode === "url" ? "Target Source URL" : mode === "text" ? "Article Content" : "Bulk URL List"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "url" ? (
                            <Input
                                placeholder="https://example.com/apt-report"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={loading}
                                className="bg-background/50 border-primary/30 focus-visible:ring-primary font-mono text-sm"
                            />
                        ) : mode === "text" ? (
                            <>
                                <textarea
                                    placeholder="Paste article text here..."
                                    value={textContent}
                                    onChange={(e) => setTextContent(e.target.value)}
                                    disabled={loading}
                                    rows={12}
                                    className="w-full bg-background/50 border border-primary/30 rounded-md p-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-y"
                                />
                                <Input
                                    placeholder="Source URL (optional)"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    disabled={loading}
                                    className="bg-background/50 border-primary/30 focus-visible:ring-primary font-mono text-sm"
                                />
                            </>
                        ) : (
                            <textarea
                                placeholder="Paste URLs here (one per line)&#10;https://example.com/article1&#10;https://example.com/article2&#10;https://example.com/article3"
                                value={bulkUrls}
                                onChange={(e) => setBulkUrls(e.target.value)}
                                disabled={bulkProcessing}
                                rows={10}
                                className="w-full bg-background/50 border border-primary/30 rounded-md p-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-y"
                            />
                        )}
                        <Button
                            type="submit"
                            disabled={loading || bulkProcessing}
                            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-bold tracking-wider"
                        >
                            {(loading || bulkProcessing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {(loading || bulkProcessing) ? "PROCESSING" : "EXECUTE"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Bulk Processing Results */}
            {mode === "bulk" && bulkResults.length > 0 && (
                <Card className="border-secondary/20 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-secondary uppercase tracking-wider font-mono text-sm">
                            Processing Results
                            {bulkSummary && (
                                <span className="ml-4 text-xs text-muted-foreground">
                                    {bulkSummary.success} success · {bulkSummary.duplicate} duplicate · {bulkSummary.error} error
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                        {bulkResults.map((result, idx) => (
                            <div
                                key={idx}
                                className={`p-3 rounded border font-mono text-xs ${result.status === "success"
                                    ? "bg-green-950/20 border-green-500/30 text-green-100"
                                    : result.status === "duplicate"
                                        ? "bg-yellow-950/20 border-yellow-500/30 text-yellow-100"
                                        : result.status === "error"
                                            ? "bg-destructive/10 border-destructive/30 text-destructive"
                                            : result.status === "processing"
                                                ? "bg-secondary/10 border-secondary/30 text-secondary animate-pulse"
                                                : "bg-background/50 border-border text-muted-foreground"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="truncate flex-1">{result.url}</span>
                                    <span className="ml-2 flex items-center gap-1">
                                        {result.status === "success" && <CheckCircle className="h-3 w-3" />}
                                        {result.status === "error" && <AlertCircle className="h-3 w-3" />}
                                        {result.status === "duplicate" && <AlertCircle className="h-3 w-3" />}
                                        {result.status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
                                        {result.status === "pending" && <Clock className="h-3 w-3" />}
                                        {result.status.toUpperCase()}
                                    </span>
                                </div>
                                {result.error && (
                                    <div className="text-xs opacity-80 mt-1">{result.error}</div>
                                )}
                                {result.data && (
                                    <div className="text-xs opacity-80 mt-1">
                                        {result.data.threat_actor} → {result.data.targeted_countries}
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Single URL/Text Mode Results */}
            {mode !== "bulk" && (
                <>
                    {status === 'error' && (
                        <div className="p-4 bg-destructive/10 border border-destructive/50 text-destructive rounded-md flex items-center shadow-[0_0_10px_oklch(var(--destructive)/10%)]">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            {errorMsg}
                        </div>
                    )}

                    {status === 'scraping' && (
                        <div className="flex items-center text-primary font-mono animate-pulse">
                            <div className="w-2 h-2 bg-primary mr-2" />
                            <span>ESTABLISHING UPLINK... SCRAPING TARGET...</span>
                        </div>
                    )}

                    {status === 'extracting' && (
                        <div className="flex items-center text-secondary font-mono animate-pulse">
                            <div className="w-2 h-2 bg-secondary mr-2" />
                            <span>NEURAL LINK ACTIVE... EXTRACTING ENTITIES...</span>
                        </div>
                    )}

                    {status === 'success' && result && (
                        <Card className="border-green-500/30 bg-green-950/20 backdrop-blur-md">
                            <CardHeader className="flex flex-row items-center space-y-0 pb-2 border-b border-green-500/20 mb-4">
                                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                                <CardTitle className="text-green-500 font-mono tracking-wider">EXTRACTION COMPLETE</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 font-mono text-sm">
                                <div className="flex border-b border-green-500/10 pb-2">
                                    <span className="w-32 text-green-500/60 uppercase">Date</span>
                                    <span className="text-green-100">{result.date}</span>
                                </div>
                                <div className="flex border-b border-green-500/10 pb-2">
                                    <span className="w-32 text-green-500/60 uppercase">Actor</span>
                                    <span className="text-green-100 font-bold">{result.threat_actor}</span>
                                </div>
                                <div className="flex border-b border-green-500/10 pb-2">
                                    <span className="w-32 text-green-500/60 uppercase">Origin</span>
                                    <span className="text-green-100">{result.attribution_country}</span>
                                </div>
                                <div className="flex border-b border-green-500/10 pb-2">
                                    <span className="w-32 text-green-500/60 uppercase">Targets</span>
                                    <span className="text-green-100">{result.targeted_countries}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-32 text-green-500/60 uppercase">Intel</span>
                                    <span className="text-green-100 italic">{result.summary}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
