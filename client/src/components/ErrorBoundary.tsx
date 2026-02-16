import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

const IS_LOCAL_DEV =
  import.meta.env.DEV &&
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isDomMutationError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isDomMutationError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const combined = `${error?.message ?? ""}\n${error?.stack ?? ""}`;
    const isDomMutationError = /removeChild|NotFoundError/i.test(combined);
    return { hasError: true, error, isDomMutationError };
  }

  componentDidCatch(error: Error) {
    // Safari/iOS (and Google Translate) can trigger transient DOM mutation errors
    // like "removeChild" which can be recovered by a single reload.
    if (!IS_LOCAL_DEV) {
      try {
        const combined = `${error?.message ?? ""}\n${error?.stack ?? ""}`;
        const isDomMutationError = /removeChild|NotFoundError/i.test(combined);
        const reloadedKey = "perpx:autoReloaded";
        if (isDomMutationError && !sessionStorage.getItem(reloadedKey)) {
          sessionStorage.setItem(reloadedKey, "1");
          window.location.reload();
        }
      } catch {
        // Ignore - fallback to render the error UI below.
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (!IS_LOCAL_DEV && this.state.isDomMutationError) {
        // Avoid showing a scary error screen for a transient DOM mutation crash.
        // We already attempted a one-time reload in componentDidCatch.
        return (
          <div className="flex items-center justify-center min-h-screen p-8 bg-background">
            <div className="flex flex-col items-center w-full max-w-2xl p-8 text-center">
              <h2 className="text-xl mb-4">Loading...</h2>

              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                Reload
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            {!IS_LOCAL_DEV ? null : (
              <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
                <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                  {this.state.error?.stack}
                </pre>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
