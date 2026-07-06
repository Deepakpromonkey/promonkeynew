"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { ToastContainer } from "@/components/ui/Toast";
const PromonkeyLayout = ({ children }) => {
    const [currentPath, setCurrentPath] = useState("/login/promonkey/dashboard");

    const handleNavigation = (path) => {
        setCurrentPath(path);
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#f8fafd]">
            {/* Sidebar Component */}
            <Sidebar 
                currentPath={currentPath} 
                onNavigate={handleNavigation} 
            />

            {/* Main Application Interface Workspace */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Topbar Component */}
                <Topbar />

                {/* Dynamic View Canvas Panel */}
                <main className="flex-1 overflow-y-auto p-6 bg-[#f8fafd]">
                    {children}
                </main>
                 <ToastContainer />
            </div>
        </div>
    );
};

export default PromonkeyLayout;