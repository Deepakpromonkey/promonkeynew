"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
    { week: "1st Week", value: 25  },
    { week: "2nd Week", value: 40  },
    { week: "3rd Week", value: 60  },
    { week: "4th Week", value: 100 },
];

export function ProjectChart() {
    return (
        <Card className="mt-3 border-none shadow-none bg-transparent">
            <CardHeader className="pb-2 pt-2 px-0">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-semibold">Project Completion</CardTitle>
                    <span className="text-xs text-muted-foreground font-semibold cursor-pointer">This Month ▾</span>
                </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
                <div className="flex items-center gap-3 mb-1">
                    <div className="flex-1 h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary w-[68%]" />
                    </div>
                    <span className="text-sm font-bold">68%</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 font-semibold">23 of 34 projects completed</p>
                <ResponsiveContainer width="100%" height={130}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="var(--color-primary)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}   />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="week" tick={{ fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false}
                            tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                        <Tooltip formatter={(v) => [`${v}%`, "Completion"]} />
                        <Area type="monotone" dataKey="value" stroke="var(--color-primary)"
                            strokeWidth={2} fill="url(#grad)" dot={{ fill: "var(--color-primary)", r: 4 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}