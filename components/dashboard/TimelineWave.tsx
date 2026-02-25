"use client";

import { useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface TimelineData {
    date: string;
    count: number;
}

interface TimelineWaveProps {
    data: TimelineData[];
    title?: string;
    className?: string;
}

export function TimelineWave({ data, title = "Event Timeline", className }: TimelineWaveProps) {

    const formattedData = useMemo(() => {
        return data.map(item => ({
            ...item,
            // Ensure date is consistent string if needed
        }));
    }, [data]);

    return (
        <Card className={`border-secondary/20 bg-card/50 backdrop-blur-sm ${className}`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-secondary uppercase tracking-wider flex items-center text-sm">
                    <Activity className="mr-2 h-4 w-4" /> {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] w-full pt-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={formattedData}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorCountWave" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #334155",
                                borderRadius: "6px",
                                color: "#f8fafc",
                            }}
                            itemStyle={{ color: "#06b6d4" }}
                            cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#06b6d4"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCountWave)"
                            style={{ filter: "drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
