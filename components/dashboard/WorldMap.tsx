"use client";

import { useEffect, useState, useRef } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Tooltip } from "react-tooltip";

// Local TopoJSON file path
const GEO_URL = "/data/world-110m.json";

interface WorldMapProps {
    data: { [key: string]: number }; // Alpha-3 -> Count
    onCountryClick: (countryCode: string) => void;
    countryMapping?: { [key: string]: string };
}

export function WorldMap({ data, onCountryClick }: WorldMapProps) {
    const [geoBubbles, setGeoBubbles] = useState<any[]>([]);
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                const height = Math.max(400, Math.min(width * 0.6, 700)); // Aspect ratio with min/max
                setDimensions({ width, height });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const maxValue = Math.max(0, ...Object.values(data));

    const colorScale = scaleLinear<string>()
        .domain([0, maxValue || 1])
        .range(["#2a2a35", "#ff0055"]); // Dark to Neon Pink

    // Calculate scale based on container width
    const mapScale = Math.max(100, dimensions.width / 8);

    return (
        <div
            ref={containerRef}
            className="w-full rounded-lg overflow-hidden bg-card/10 relative"
            style={{ height: `${dimensions.height}px` }}
        >
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: mapScale }}
                width={dimensions.width}
                height={dimensions.height}
            >
                <ZoomableGroup>
                    <Geographies geography={GEO_URL}>
                        {({ geographies }: { geographies: any[] }) =>
                            geographies.map((geo) => {
                                // Default world-atlas 110m uses ISO A3 in 'properties.ISO_A3' 
                                // OR checks if 'id' is defined.
                                // We expect data keys to be matching geo identifiers.
                                const geoId = geo.properties?.ISO_A3 || geo.id;
                                const cur = data[geoId] || 0;
                                const name = geo.properties?.name || "Unknown";

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={cur > 0 ? colorScale(cur) : "oklch(0.2 0.05 260)"}
                                        stroke="oklch(0.3 0.1 260)"
                                        style={{
                                            default: { outline: "none", transition: "all 250ms" },
                                            hover: { fill: "oklch(0.65 0.25 330)", outline: "none", cursor: "pointer", filter: "drop-shadow(0 0 5px oklch(0.65 0.25 330))" },
                                            pressed: { outline: "none" },
                                        }}
                                        onClick={() => onCountryClick(geoId)}
                                        data-tooltip-id="my-tooltip"
                                        data-tooltip-content={`${name}: ${cur} events`}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
            <Tooltip id="my-tooltip" />
        </div>
    );
}
