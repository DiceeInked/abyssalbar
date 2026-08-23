"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HtmlRunner() {
  const router = useRouter();
  const [html, setHtml] = useState("");

  useEffect(() => {
    const storedHtml = window.sessionStorage.getItem("abyssal-bar-html");

    if (!storedHtml) {
      router.replace("/");
      return;
    }

    setHtml(storedHtml);
  }, [router]);

  if (!html) {
    return null;
  }

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        background: "#fff",
      }}
    >
      <iframe
        title="HTML runner"
        sandbox=""
        srcDoc={html}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    </main>
  );
}
