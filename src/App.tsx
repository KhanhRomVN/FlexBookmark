import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@/presentation/providers/theme-provider";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Tabs, TabsContent } from "@/presentation/components/ui/tabs";
import { AuthProvider } from "./contexts/AuthContext";
import Dashboard from "@/presentation/tab/Dashboard";
import BookmarkManager from "@/presentation/tab/BookmarkManager";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "bookmarkManager">(
    "dashboard"
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (
        el &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) ||
          el.isContentEditable)
      )
        return;
      // support top-row and numpad keys
      if (e.key === "1" || e.code === "Digit1" || e.code === "Numpad1") {
        setActiveTab("dashboard");
      }
      if (e.key === "2" || e.code === "Digit2" || e.code === "Numpad2") {
        setActiveTab("bookmarkManager");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Load persisted activeTab from chrome.storage
  useEffect(() => {
    chrome.storage.local.get(["flexbookmark_active_tab"], (result) => {
      if (
        result.flexbookmark_active_tab &&
        (result.flexbookmark_active_tab === "dashboard" ||
          result.flexbookmark_active_tab === "bookmarkManager" ||
          result.flexbookmark_active_tab === "taskManager" ||
          result.flexbookmark_active_tab === "habitManager" ||
          result.flexbookmark_active_tab === "moneyManager")
      ) {
        setActiveTab(result.flexbookmark_active_tab);
      }
    });
  }, []);

  // Persist activeTab in chrome.storage
  useEffect(() => {
    chrome.storage.local.set({ flexbookmark_active_tab: activeTab });
  }, [activeTab]);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <AuthProvider>
            <div className="min-h-screen flex flex-col ">
              <Tabs
                value={activeTab}
                onValueChange={(v) =>
                  setActiveTab(v as "dashboard" | "bookmarkManager")
                }
              >
                <TabsContent value="dashboard" className="flex-1 overflow-auto">
                  <Dashboard />
                </TabsContent>
                <TabsContent
                  value="bookmarkManager"
                  className="flex-1 overflow-auto"
                >
                  <BookmarkManager />
                </TabsContent>
              </Tabs>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
