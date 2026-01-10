import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { AppShell } from "@/components/layout";

import ProductsHome from "./pages/ProductsHome";
import ProductHome from "./pages/ProductHome";
import ProblemsPage from "./pages/ProblemsPage";
import HypothesesPage from "./pages/HypothesesPage";
import ExperimentsPage from "./pages/ExperimentsPage";
import DecisionsPage from "./pages/DecisionsPage";
import ArtifactsPage from "./pages/ArtifactsPage";
import TimelinePage from "./pages/TimelinePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ProductProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<Navigate to="/products" replace />} />
                <Route path="/products" element={<ProductsHome />} />
                <Route path="/product/:productId/home" element={<ProductHome />} />
                <Route path="/product/:productId/problems" element={<ProblemsPage />} />
                <Route path="/product/:productId/hypotheses" element={<HypothesesPage />} />
                <Route path="/product/:productId/experiments" element={<ExperimentsPage />} />
                <Route path="/product/:productId/decisions" element={<DecisionsPage />} />
                <Route path="/product/:productId/artifacts" element={<ArtifactsPage />} />
                <Route path="/product/:productId/timeline" element={<TimelinePage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProductProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
