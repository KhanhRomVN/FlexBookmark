import React, { useState, useEffect } from "react";
import { ThemeProvider } from "@/presentation/providers/theme-provider";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Tabs, TabsContent } from "@/presentation/components/ui/tabs";
import Dashboard from "@/presentation/tab/Dashboard";
import BookmarkManager from "@/presentation/tab/BookmarkManager";
import TaskAndEvent from "@/presentation/tab/Calendar";
import TaskManager from "@/presentation/tab/TaskManager";

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
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "manager" | "tasks" | "taskManager"
  >("dashboard");

  // Keyboard shortcuts: 1 = Dashboard, 2 = Bookmarks, 3 = Tasks, 4 = Task Manager
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
        setActiveTab("manager");
      }
      if (e.key === "3" || e.code === "Digit3" || e.code === "Numpad3") {
        setActiveTab("tasks");
      }
      if (e.key === "4" || e.code === "Digit4" || e.code === "Numpad4") {
        setActiveTab("taskManager");
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
          result.flexbookmark_active_tab === "manager" ||
          result.flexbookmark_active_tab === "tasks" ||
          result.flexbookmark_active_tab === "taskManager")
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
          <div className="min-h-screen flex flex-col ">
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(
                  v as "dashboard" | "manager" | "tasks" | "taskManager"
                )
              }
            >
              <TabsContent value="dashboard" className="flex-1 overflow-auto">
                <Dashboard />
              </TabsContent>
              <TabsContent value="manager" className="flex-1 overflow-auto">
                <BookmarkManager />
              </TabsContent>
              <TabsContent value="tasks" className="flex-1 overflow-auto">
                <TaskAndEvent />
              </TabsContent>
              <TabsContent value="taskManager" className="flex-1 overflow-auto">
                <TaskManager />
              </TabsContent>
            </Tabs>
          </div>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
