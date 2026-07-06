import { Users, Briefcase, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
	{ icon: Users,      value: "128", label: "Employees", color: "text-violet-500" },
	{ icon: Briefcase,  value: "45",  label: "Projects",  color: "text-cyan-500"   },
	{ icon: TrendingUp, value: "78",  label: "Clients",   color: "text-emerald-500"},
];

export function BusinessOverview() {
	return (
		<Card>
			<CardHeader className="pb-2 pt-4 px-4">
				<CardTitle className="text-sm font-semibold">Business Overview</CardTitle>
			</CardHeader>
			<CardContent className="px-4 pb-4">
				<div className="grid grid-cols-3 gap-2">
					{stats.map(({ icon: Icon, value, label, color }) => (
						<div key={label} className="rounded-lg bg-muted/60 p-3 flex flex-col gap-1">
						<Icon size={18} className={color} />
						<p className="text-xl font-bold">{value}</p>
						<p className="text-xs text-muted-foreground">{label}</p>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}