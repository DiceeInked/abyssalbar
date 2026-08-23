import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { GAME_BUCKET } from "../../../../lib/constants";

const CONTENT_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  mp4: "video/mp4",
  webm: "video/webm",
  wasm: "application/wasm",
  txt: "text/plain; charset=utf-8",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const storagePath = path.join("/");

  if (!storagePath || storagePath.includes("..")) {
    return new NextResponse("Invalid game path.", { status: 400 });
  }

  const { data } = supabase.storage
    .from(GAME_BUCKET)
    .getPublicUrl(storagePath);

  const response = await fetch(data.publicUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    return new NextResponse("Game file not found.", {
      status: response.status,
    });
  }

  const extension = storagePath.split(".").pop()?.toLowerCase() ?? "";
  const contentType =
    CONTENT_TYPES[extension] ??
    response.headers.get("content-type") ??
    "application/octet-stream";

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
