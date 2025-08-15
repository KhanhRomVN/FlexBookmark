import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@/presentation/providers/theme-provider";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/presentation/components/ui/tabs";
import Dashboard from "@/presentation/tab/Dashboard";
import BookmarkManager from "@/presentation/tab/BookmarkManager";
// import TaskAndEvent from "@/presentation/tab/TaskAndEvent";

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
  const [activeTab, setActiveTab] = useState<"dashboard" | "manager" | "tasks">(
    "dashboard"
  );

  // Keyboard shortcuts: 1 = Dashboard, 2 = Bookmarks
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") setActiveTab("dashboard");
      if (e.key === "2") setActiveTab("manager");
      // if (e.key === "3") setActiveTab("tasks");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  // Load persisted activeTab
  useEffect(() => {
    const stored = window.localStorage.getItem("activeTab");
    if (stored === "dashboard" || stored === "manager" || stored === "tasks") {
      setActiveTab(stored);
    }
  }, []);

  // Persist activeTab in localStorage
  useEffect(() => {
    window.localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <div className="min-h-screen flex flex-col ">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as any)}
            >
              <TabsContent value="dashboard" className="flex-1 overflow-auto">
                <Dashboard />
              </TabsContent>
              <TabsContent value="manager" className="flex-1 overflow-auto">
                <BookmarkManager />
              </TabsContent>
              {/* <TabsContent value="tasks" className="flex-1 overflow-auto">
                <TaskAndEvent />
              </TabsContent> */}
            </Tabs>
          </div>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
