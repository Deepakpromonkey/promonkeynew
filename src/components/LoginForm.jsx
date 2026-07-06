"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { API_BASE } from "@/lib/api";
import { ToastContainer, toast } from "./ui/Toast";
export function LoginForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [email,        setEmail]        = useState("");
    const [password,     setPassword]     = useState("");
    const [isLoading,    setIsLoading]    = useState(false);
    const [fieldErrors,  setFieldErrors]  = useState({ email: false, password: false });
    async function handleLogin(e) {
        e.preventDefault();
        setIsLoading(true);
        setFieldErrors({ email: false, password: false });
        if (!email.trim()) {
            setFieldErrors(f => ({ ...f, email: true }));
            toast.error({ title: "Email required", message: "Please enter your email address." });
            setIsLoading(false);
            return;
        }
        if (!password) {
            setFieldErrors(f => ({ ...f, password: true }));
            toast.error({ title: "Password required", message: "Please enter your password." });
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const json = await response.json();
            if (!response.ok) {
                setFieldErrors({ email: true, password: true });
                throw new Error(json.message || "Invalid credentials. Please try again.");
            }
            /* ── store token ── */
            if (json.token) {
                localStorage.setItem("crm_auth_token", json.token);
                document.cookie = [
                    `crm_auth_token=${json.token}`,
                    "path=/",
                    `max-age=${60 * 60 * 24 * 7}`,
                    "SameSite=Lax",
                ].join("; ");
            }
            
            const userData = json.data ?? json.user ?? null;
            if (userData) {
                const normalizedUser = {
                    ...userData,
                    role: userData.role?.toLowerCase() ?? "employee",
                    name: userData.name ?? userData.email?.split("@")[0] ?? "User",
                };
                
                localStorage.setItem("crm_user", JSON.stringify(normalizedUser));
            }
           
            if (userData?.employeeProfile) {
                localStorage.setItem("crm_employee", JSON.stringify(userData.employeeProfile));
            }
            const displayName = userData?.name ?? userData?.email?.split("@")[0] ?? "Admin";
            toast.success({
                title: "Access Granted",
                message: `Welcome back, ${displayName}.`,
                duration: 2500,
            });
            const params = new URLSearchParams(window.location.search);
            const from   = params.get("from") || "/promonkey/dashboard";
            router.push(from);
        } catch (err) {
            toast.error({
                title: "Authentication Failed",
                message: err.message,
                duration: 6000,
            });
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <>
        <ToastContainer />
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                <Label
                    htmlFor="email"
                    className="text-sm font-semibold transition-colors flex items-center justify-between"
                    style={{ color: fieldErrors.email ? "#b91c1c" : "" }}
                >
                <span>Email Address</span>
                    {fieldErrors.email && (
                <span className="text-xs font-medium normal-case tracking-normal">— required</span>
                    )}
                </Label>
                <div className="relative">
                <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                    style={{ color: fieldErrors.email ? "#ef4444" : "" }}
                 />
                <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors(f => ({ ...f, email: false }));
                    }}
                    className="pl-11 h-12 rounded-xl text-sm transition-all"
                    style={{
                        borderColor:     fieldErrors.email ? "#ef4444" : "",
                        backgroundColor: fieldErrors.email ? "rgba(254,242,242,0.5)" : "",
                        boxShadow:       fieldErrors.email ? "0 0 0 1px #ef4444" : "",
                    }}
                    disabled={isLoading}
                />
                </div>
                </div>
               {/* Password */}
                <div className="flex flex-col gap-1.5">
                    <Label
                        htmlFor="password"
                        className="text-sm font-semibold transition-colors flex items-center justify-between"
                        style={{ color: fieldErrors.password ? "#b91c1c" : "" }}
                    >
                    <span>Password</span>
                        {fieldErrors.password && (
                    <span className="text-xs font-medium normal-case tracking-normal">— required</span>
                            )}
                    </Label>
                    <div className="relative">
                    <Lock
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                        style={{ color: fieldErrors.password ? "#ef4444" : "" }}
                    />
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) setFieldErrors(f => ({ ...f, password: false }));
                        }}
                        className="pl-11 pr-12 h-12 rounded-xl text-sm transition-all"
                        style={{
                            borderColor:     fieldErrors.password ? "#ef4444" : "",
                            backgroundColor: fieldErrors.password ? "rgba(254,242,242,0.5)" : "",
                            boxShadow:       fieldErrors.password ? "0 0 0 1px #ef4444" : "",
                        }}
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-foreground cursor-pointer transition-colors"
                        style={{ color: fieldErrors.password ? "#ef4444" : "" }}
                    >
                        {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    </div>
                </div>
                {/* Submit */}
                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/25 mt-1"
                    disabled={isLoading}
                >
                    {isLoading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                            Logging in...
                    </span>
                    ) : "Login"}
                </Button>
            </form>
        </>
    );
}