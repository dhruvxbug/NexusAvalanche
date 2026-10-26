import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	error: Error | null;
}

/**
 * Catches any render-time crash in the dashboards and shows a recoverable
 * error card instead of a blank white screen.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error };
	}

	componentDidCatch(error: Error, info: { componentStack: string }) {
		console.error("Dashboard crashed:", error, info.componentStack);
	}

	render() {
		if (this.state.error) {
			return (
				<div className="flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-card p-10 text-center shadow-sm">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
						<AlertTriangle className="h-6 w-6 text-destructive" />
					</div>
					<h3 className="font-display text-xl font-bold text-foreground">Something went wrong</h3>
					<p className="text-sm text-muted-foreground">
						{this.state.error.message || "An unexpected error occurred while rendering the dashboard."}
					</p>
					<button
						onClick={() => window.location.reload()}
						className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
					>
						<RefreshCw className="h-4 w-4" />
						Reload
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}
