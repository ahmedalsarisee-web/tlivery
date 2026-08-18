import {Component, ErrorInfo} from "react";
import {
  ErrorBoundaryProps,
  ErrorBoundaryState,
} from "@app/types/errorBoundary.props";
import ErrorFallback from "./ErrorFallback";

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {error: null};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {error};
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({error: null});

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
