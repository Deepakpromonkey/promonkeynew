import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BusinessOverview } from "@/components/BusinessOverview";
import { ProjectChart }     from "@/components/ProjectChart";
import { LoginForm }        from "@/components/LoginForm";
import { ThemeToggle }      from "@/components/ThemeToggle";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6  transition-colors duration-300 relative overflow-hidden selection:bg-primary selection:text-white">

            <div className="absolute top-1/4 -left-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 -left-16 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            <div className="absolute top-[45%] left-4 opacity-40 grid grid-cols-3 gap-2 pointer-events-none dark:hidden">
                {[...Array(9)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-foreground/30" />)}
            </div>

            <div className="absolute top-[52%] right-4 opacity-40 grid grid-cols-3 gap-2 pointer-events-none dark:hidden">
                {[...Array(15)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-foreground/30" />)}
            </div>

            <header className="w-full max-w-6xl mx-auto flex justify-start items-center gap-2.5 mb-8 lg:mb-0 z-10">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-lg select-none shadow-lg shadow-primary/20">
                    🐒
                </div>
                <span className="text-xl font-bold tracking-tight">
                    Promonkey <span className="text-primary font-medium">CRM</span>
                </span>
            </header>

            <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-11 mt-6 gap-8 items-center my-auto z-10">

                <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
                    <div>
                        <h1 className="text-4xl md:text-4xl font-bold tracking-tight mb-2">
                            Welcome Back!
                        </h1>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Sign in to <span className="text-primary">your account</span>
                        </h2>
                        <p className="text-muted-foreground mt-4 text-base font-medium leading-relaxed max-w-md">
                            Manage your team, projects, clients and business performance from one place.
                        </p>
                    </div>

                    <div className="w-full max-w-md bg-card/40 backdrop-blur-sm border border-border/80 rounded-3xl p-5 shadow-xl shadow-foreground/[0.01]">
                        <BusinessOverview />
                        <ProjectChart />
                    </div>
                </div>

                <div className="lg:col-span-6 flex justify-center lg:justify-end w-full">
                    <Card className="w-full max-w-[540px] border border-border/90 rounded-[2.5rem] shadow-2xl shadow-foreground/[0.02] bg-card">
                        <CardHeader className="flex flex-col items-center text-center pt-10 pb-2 px-10">
                            
                            <div className="w-[88px] h-[88px] rounded-full bg-primary/10 flex items-center justify-center mb-5">
                                <Lock size={36} strokeWidth={1.8} className="text-primary" />
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight">
                                Login to <span className="text-primary">Promonkey CRM</span>
                            </CardTitle>
                            <CardDescription className="text-sm font-medium mt-1.5">
                                Enter your credentials to access your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 pb-10 pt-6">
                            <LoginForm />
                        </CardContent>
                    </Card>
                </div>

            </main>

            <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-center text-xs font-semibold text-muted-foreground z-10 pt-8 lg:pt-4">
                <div>
                    © 2026 <span className="text-primary font-bold">Promonkey CRM</span>. All rights reserved.
                </div>
                <ThemeToggle />
            </footer>

        </div>
    );
}