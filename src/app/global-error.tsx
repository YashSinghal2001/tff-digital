"use client";

import { useEffect } from "react";

// Deliberately self-contained (inline styles, no design-system imports):
// this only renders when the root layout itself throws, so it can't
// depend on anything that layout provides.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          background: "#0C1025",
          color: "#FFFFFF",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>Something went wrong.</h1>
        <p style={{ color: "#D8D8D8", maxWidth: "420px", fontSize: "14px" }}>
          The site hit an unexpected error. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "8px",
            padding: "10px 24px",
            borderRadius: "9999px",
            border: "none",
            background: "linear-gradient(90deg, #3882F6 0%, #8B5CF6 100%)",
            color: "#FFFFFF",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
