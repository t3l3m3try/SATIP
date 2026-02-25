
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { CSVStore } from '@/lib/csv-store';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Check for duplicates
        if (CSVStore.articleExists(url)) {
            return NextResponse.json({ error: 'Article with this URL already exists' }, { status: 409 });
        }

        const response = await fetch(url);
        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: 500 });
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        // Naive text extraction - improve as needed
        // Remove scripts, styles
        $('script').remove();
        $('style').remove();
        $('nav').remove();
        $('footer').remove();
        const title = $('title').text().trim() || 'Untitled Article';
        const text = $('body').text().replace(/\s+/g, ' ').trim();

        const timestamp = Date.now();
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${timestamp}_${safeTitle}.md`;
        const dataDir = path.join(process.cwd(), 'data', 'articles');

        // Ensure directory exists
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const filepath = path.join(dataDir, filename);
        const content = `# ${title}\n\nURL: ${url}\n\n${text}`;

        fs.writeFileSync(filepath, content);

        return NextResponse.json({ success: true, filepath, content, title });

    } catch (error: any) {
        console.error('Scrape error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
