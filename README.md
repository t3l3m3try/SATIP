# 🛡️ SATIP — Strategic Adversaries Threat Intelligence Platform

A self-hosted, offline-first **Strategic Adversaries Threat Intelligence Platform (SATIP)** that ingests open-source threat reports, extracts structured intelligence with an LLM, and visualises the global threat landscape in real time.

Reference: https://t3l3m3try.medium.com/satip-strategic-adversaries-threat-intelligence-platform-1c3f24c2d2c4 

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

---

## ✨ Features

### 📡 Intelligence Ingestion
- **URL Scraping** — paste any article URL; the app scrapes and extracts CTI fields automatically
- **Direct Text** — paste raw article text (useful for paywalled or PDF-extracted content)
- **Bulk Processing** — submit a list of URLs (one per line) and process them sequentially with live status tracking
- **Duplicate Prevention** — URLs are normalised and checked before ingestion to avoid duplicate records

### 🗺️ Global Threat Map
- Interactive world heatmap showing targeted countries by incident count
- Click any country to reveal a focus panel with related actors and recent intel
- Filter by **year**, **date range**, or **free-text search** across all fields

### 📊 Dashboard Analytics
- **Recorded Events** — total unique threat incidents
- **Active Threat Actors** — unique attributed groups
- **Targeted Countries** — unique countries across all events
- **Event Timeline** — yearly activity wave chart
- **Top 5** threat actors, targeted countries, and targeted sectors — all clickable

### 🕵️ Threat Actor Profiles
- Per-actor detail pages with event history, first/last seen dates, targeted countries and top sectors
- Searchable actor database

### 🌍 Country & Sector Pages
- Country profile pages with full intel history and actor breakdown
- Sector profile pages showing all events and contributing actors

<img width="1960" height="1228" alt="1" src="https://github.com/user-attachments/assets/e3b9d925-f65a-4ec0-a466-c7c5829e4852" />

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Map | `react-simple-maps`, `d3-geo` |
| Charts | `recharts` |
| Data | CSV flat files (`articles.csv`) via PapaParse |
| Scraping | `cheerio` (server-side) |
| LLM Extraction | Google Gemini (`@google/generative-ai`) |
| Language | TypeScript 5 |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Installation

```bash
git clone https://github.com/t3l3m3try/SATIP.git
cd SATIP
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
SATIP/
├── app/
│   ├── page.tsx              # Main dashboard (map, stats, filters)
│   ├── add/page.tsx          # Intelligence ingestion UI
│   ├── events/page.tsx       # Full event log
│   ├── threat-actors/        # Actor list + detail pages
│   ├── countries/            # Country list + detail pages
│   ├── sectors/              # Sector list + detail pages
│   └── api/                  # API routes (data, scrape, extract, ...)
├── components/
│   ├── dashboard/            # WorldMap, StatsCard, TimelineWave
│   ├── EventCard.tsx
│   └── ui/                   # shadcn/ui primitives
├── lib/
│   ├── csv-store.ts          # CSV read/write with in-memory cache
│   ├── article-service.ts    # Article retrieval & slug generation
│   ├── threat-actor-service.ts
│   ├── country-mapping.ts    # Alpha-2 ↔ Numeric ISO mappings
│   └── threat-data.ts        # Shared types & helper functions
└── data/
    ├── articles.csv           # All ingested threat intelligence
    └── Countries.csv          # ISO country reference list
```

---

## 🔄 How Intelligence Ingestion Works

```
User submits URL / Text
        │
        ▼
  [/api/scrape]            ← Fetches & cleans article HTML (Cheerio)
        │
        ▼
  [/api/extract]           ← Sends content to Gemini LLM
        │                     Extracts: date, threat actor, attribution country,
        │                     targeted countries, sectors, summary, risk score,
        │                     what/when/where/who/why/how/so_what/what_is_next
        ▼
  CSVStore.addArticle()    ← Appends to articles.csv, invalidates cache
        │
        ▼
  Dashboard updates on next page load
```

---

## 📝 Data Schema

Each record in `articles.csv` captures the following fields:

| Field | Description |
|---|---|
| `date` | Event date (YYYY-MM-DD) |
| `threat_actor` | Attributed group name |
| `attribution_country` | Country of origin (Alpha-2) |
| `targeted_countries` | Comma-separated Alpha-2 codes |
| `targeted_sectors` | Comma-separated industry sectors |
| `title` | Article title |
| `summary` | One-sentence summary |
| `risk_score` | LLM-assessed severity (0–100) |
| `what` / `when` / `where` / `who` / `why` / `how` | 5W1H structured breakdown |
| `so_what` | Strategic significance |
| `what_is_next` | Predicted next actions |
| `url` | Source URL |

---

## ⚙️ Performance Notes

- **Server-side CSV cache** — `articles.csv` is parsed once and held in memory for 30 seconds; automatically invalidated on ingestion
- **O(1) country lookups** — country code → name resolution uses a `Map` built once per render cycle
- **Shared aggregations** — country hit-counts are computed once and shared across all derived `useMemo` values on the homepage

---

## 📄 License

MIT
