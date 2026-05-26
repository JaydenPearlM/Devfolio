import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Optionally send error to analytics
    if (window.analytics?.recordClientError) {
      window.analytics.recordClientError({
        path: window.location.pathname,
        meta: {
          source: "ErrorBoundary",
          message: error?.message || String(error),
          componentStack: errorInfo?.componentStack?.substring(0, 500),
        },
      }).catch(() => {});
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#0a0a0a",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              width: "100%",
            }}
          >
            <h1
              style={{
                fontSize: "2rem",
                marginBottom: "1rem",
                color: "#8b5cf6",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                marginBottom: "2rem",
                color: "#a0a0a0",
              }}
            >
              The application encountered an unexpected error. This has been logged.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details
                style={{
                  marginBottom: "2rem",
                  textAlign: "left",
                  backgroundColor: "#1a1a1a",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid #333",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  Error Details (Dev Mode)
                </summary>
                <pre
                  style={{
                    fontSize: "0.875rem",
                    color: "#ff6b6b",
                    overflow: "auto",
                    marginTop: "0.5rem",
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  backgroundColor: "#8b5cf6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#7c3aed";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#8b5cf6";
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  backgroundColor: "#333",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#444";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#333";
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
