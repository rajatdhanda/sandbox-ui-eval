// path: src/diagnostics/ErrorBoundary.tsx
import React from "react";
type Props = { children: React.ReactNode, onError?: (error: any, info: any) => void };
type State = { hasError: boolean, error?: any };
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  componentDidCatch(error: any, info: any) {
    this.setState({ hasError: true, error });
    if (this.props.onError) this.props.onError(error, info);
    if (typeof window !== "undefined") {
      (window as any).__reactError__ = { error, info };
    }
  }
  render() {
    if (this.state.hasError) return <div>Something went wrong.</div>;
    return this.props.children;
  }
}