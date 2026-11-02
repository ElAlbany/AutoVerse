"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "Arial,sans-serif",
          padding: "8vw",
          background: "#f4f2ec",
          color: "#202a25",
        }}
      >
        <h1>Let's try that again.</h1>
        <p>AutoVerse could not start this page. Please retry.</p>
        <button
          onClick={reset}
          style={{ padding: "12px 24px", marginRight: 16 }}
        >
          Try again
        </button>
        <a href="/">Return home</a>
      </body>
    </html>
  );
}
