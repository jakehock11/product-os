import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/products";
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="max-w-lg w-full border-destructive/30">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-lg">Something went wrong</CardTitle>
              <CardDescription className="text-sm">
                An unexpected error occurred. You can try reloading the page or going back to the home screen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="rounded-md bg-muted p-3">
                  <p className="font-mono text-xs text-muted-foreground break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReset}
                  className="gap-2"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleReload}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                <Button
                  size="sm"
                  onClick={this.handleGoHome}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Smaller error boundary for component-level errors
export class ComponentErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ComponentErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Something went wrong loading this section.
          </p>
          <Button variant="outline" size="sm" onClick={this.handleRetry}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
