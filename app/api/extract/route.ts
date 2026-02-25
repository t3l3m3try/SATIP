
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import { CSVStore } from '@/lib/csv-store';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { content, url, filepath } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }
        // Helper to fetch available models
        let candidateModels = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

        try {
            // Dynamically fetch models if we can
            const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
            if (modelsRes.ok) {
                const data = await modelsRes.json();
                const availableModels = data.models
                    .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
                    .map((m: any) => m.name.replace("models/", ""));

                // Prioritize our preferred ones, but fallback to whatever is available
                const preferred = availableModels.filter((m: string) => candidateModels.includes(m));
                const others = availableModels.filter((m: string) => !candidateModels.includes(m));
                candidateModels = [...preferred, ...others];
                console.log("Dynamically found models:", candidateModels);
            }
        } catch (e) {
            console.error("Failed to list models dynamically", e);
        }

        // Loop through candidates until one works
        let text = "";
        let usedModel = "";
        let errorMsg = "";

        // Deduplicate
        candidateModels = [...new Set(candidateModels)];

        const prompt = `
    You are a Cyber Threat Intelligence Analyst. 
    Analyze the following article text and extract the required fields in JSON format.
    
    Fields:
    - title: Create a concise, relevant title for the article if one is not explicitly provided.
    - date: Date when the attacks were observed or the article date if not specified (YYYY-MM-DD). Return empty string if unknown.
    - summary: A concise one-line summary of the activity.
    - what: A concise one-line summary of the "what?" about the article.
    - when: A concise one-line summary of the "when?" about the article.
    - where: A concise one-line summary of the "where?" about the article.
    - who: A concise one-line summary of the "who?" about the article.
    - why: A concise one-line summary of the "why?" about the article.
    - how: A concise one-line summary of the "how?" about the article.
    - so_what: A concise one-line summary of the "so what?" (impact/implication).
    - what_is_next: A concise one-line summary on what could happen next (Provide an assessment of the likely next steps or outcomes)
    - threat_actor: Main threat actor involved (e.g., APT28, Lazarus, APT36, etc.). Only if the article specifically mentions the threat actor name and mention sentences such "also known as" and list the aliases related to the same threat actor, then you need to choose the alias containing APT and a number (for example, APT28) over other names. If multiple threat actors are mentioned, list "Multiple" with no attribution_country. If there is nexus mentioned such as "China-nexus" or link such as "China-linked" or operators such as "China operators" normalize into "China-nexus" or just mention the threat actor name if it is a known threat actor without any addition. If there is an addition after the name such "DoNot APT Group" normalize into "DoNot" leaving only the name.
    - attribution_country: Attribution country of the actor, ONLY if explicitly stated. Use Alpha-2 code (e.g., RU, KP, CN, IR). Return empty string if unknown.    
    - targeted_countries: List the targeted countries mentioned in the article. Be precise and use Alpha-2 codes (e.g., ["US", "DE", "UA", "IT", "IN", "YE", "IL"]). Return empty string if no target country is mentioned in the article.
    - targeted_sectors: List all targeted sectors mentioned. Comma-separated string and Return empty string if unknown. Select ONLY from the following list:
        Government: Ministries, regulators, municipalities, public administration
        Defense & Military: Armed forces, MOD, defense procurement, military research
        Diplomacy: Embassies, diplomats, consulates, foreign affairs bodies
        Intergovernmental Organizations: UN agencies, NATO/EU bodies, multilateral institutions
        Non-governmental Organizations: NGOs, think tanks, humanitarian organizations
        Energy & Utilities: Oil & gas, electricity, nuclear, power grid, water
        Financial Services: Banks, insurance, investment firms, fintech, payment processors
        Technology: Software companies, hardware vendors, cloud providers, IT services, cybersecurity firms
        Telecommunications: ISPs, mobile operators, backbone providers, satellite comms
        Manufacturing & Industrial: Automotive, aerospace, electronics, heavy industry, ICS/OT environments
        Transportation & Logistics: Airlines, shipping, rail, ports, freight, supply chain operators
        Healthcare & Life Sciences: Hospitals, pharma, biotech, medical research
        Retail & E-commerce: Online platforms, retail chains, consumer goods sellers
        Media & Journalism: News outlets, publishers, broadcasters
        Education & Research: Universities, academic labs, scientific institutes
    - risk_score: Calculate a Risk Score (0-100). You must follow these strict mathematical rules, selecting only ONE value per category (the highest applicable):
        1. Technical Complexity (Max 40 pts)
            40 pts: Evidence of highly sophisticated attacks such as 0-day exploitation, Man-on-the-Side (MotS) attacks, or advanced custom rootkits or mobile spyware.
            30 pts: Evidence of Supply Chain compromises or vulnerabilities exploitation of known CVEs or use of custom malware.
            20 pts: Evidence of typical attacks such as Phishing combined with commodity malware, droppers or infostealers.
            10 pts: Evidence of automated scans, probes, or basic credential stuffing.
            0 pts: No technical attack data present.
        2. Geographic Reach (Max 40 pts)
            40 pts: Global reach (the targets are across 3+ regions).
            30 pts: Regional reach (the targets are in one single region such as Europe, Middle East, South Asia, or LATAM).
            20 pts: Multiple countries (the targets are in 2 or more specific nations but not a whole region).
            10 pts: Country-specific (the targets are in one single country).
            0 pts: No geographic data present.
        3. Intent & Impact (Max 20 pts)
            20 pts: Strategic Espionage or Critical Infrastructure Disruption.
            10 pts: Financial gain, Hacktivism, or generic data theft.
            0 pts: No clear intent described.
        Calculation Logic:
            Total Score = [Complexity Score] + [Reach Score] + [Intent Score].

    Article Text:
    ${content}
    `;

        for (const modelName of candidateModels) {
            try {
                console.log(`Attempting to use model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                text = response.text();
                usedModel = modelName;
                break; // a success!
            } catch (err: any) {
                console.error(`Model ${modelName} failed:`, err.message);
                errorMsg = err.message;
                // continue to next model
            }
        }

        if (!text) {
            throw new Error(`All models failed. Last error: ${errorMsg}`);
        }

        let extractedData;
        try {
            extractedData = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse LLM response", text);
            return NextResponse.json({ error: "Failed to parse LLM response" }, { status: 500 });
        }

        // Format for CSVStore
        const articleRecord = {
            date: extractedData.date,
            threat_actor: extractedData.threat_actor,
            attribution_country: extractedData.attribution_country,
            targeted_countries: Array.isArray(extractedData.targeted_countries) ? extractedData.targeted_countries.join(',') : extractedData.targeted_countries,
            targeted_sectors: Array.isArray(extractedData.targeted_sectors) ? extractedData.targeted_sectors.join(',') : extractedData.targeted_sectors,
            title: extractedData.title,
            risk_score: extractedData.risk_score,
            summary: extractedData.summary,
            what: extractedData.what,
            when: extractedData.when,
            where: extractedData.where,
            who: extractedData.who,
            why: extractedData.why,
            how: extractedData.how,
            so_what: extractedData.so_what,
            what_is_next: extractedData.what_is_next,
            url: url
        };

        // Check if threat_actor is empty
        if (!articleRecord.threat_actor || articleRecord.threat_actor.trim() === "") {
            console.log("⚠️ Skipping article due to empty threat_actor");
            return NextResponse.json({ success: false, message: "Skipped: No threat actor found", data: articleRecord, used_model: usedModel });
        }

        CSVStore.addArticle(articleRecord);

        return NextResponse.json({ success: true, data: articleRecord, used_model: usedModel });

    } catch (error: any) {
        console.error('Extract error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
