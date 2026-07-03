"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: 24,
          textAlign: "center",
          background: "#f3efe5",
          color: "#221f19",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 30, fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#6f6a5d", maxWidth: 420, margin: 0 }}>
          The app hit an unexpected error. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            height: 44,
            padding: "0 24px",
            borderRadius: 9999,
            border: "none",
            background: "#1f6a57",
            color: "#fff",
            fontWeight: 500,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
