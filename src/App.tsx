import { ThemeProvider } from "@/presentation/providers/theme-provider";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { publicRoutes } from "@/presentation/routes/routes";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, Fragment } from "react";
import { ErrorBoundary } from "@/presentation/components/common/ErrorBoundary";
import { LoadingSpinner } from "@/presentation/components/common/LoadingSpinner";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Router>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {publicRoutes.map((route, idx) => {
                    const Element = route.element;
                    const Layout = route.layout ?? Fragment;

                    return (
                      <Route
                        key={idx}
                        path={route.path}
                        element={
                          <Layout>
                            <ErrorBoundary>
                              <Element />
                            </ErrorBoundary>
                          </Layout>
                        }
                      />
                    );
                  })}
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Router>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
