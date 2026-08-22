import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "../../../lib/supabase";

const SESSION_COOKIE = "abyssal_session";

const setSessionCookie = async (token: string) => {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body?.action;
    const username = typeof body?.username === "string" ? body.username : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (action === "sign_up") {
      const { data: account, error: createError } = await supabase.rpc(
        "create_account",
        {
          p_username: username,
          p_password: password,
        }
      );

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 400 }
        );
      }

      // Sign the new account in immediately so /sign up leaves the user logged in.
      const { data: session, error: sessionError } = await supabase.rpc(
        "create_account_session",
        {
          p_username: username,
          p_password: password,
        }
      );

      if (sessionError || !session) {
        return NextResponse.json(
          { error: sessionError?.message ?? "Account created, but sign-in failed." },
          { status: 500 }
        );
      }

      const result = session as {
        token: string;
        id: string;
        username: string;
      };

      await setSessionCookie(result.token);

      return NextResponse.json({
        account: account,
      });
    }

    if (action === "sign_in") {
      const { data, error } = await supabase.rpc("create_account_session", {
        p_username: username,
        p_password: password,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }

      const result = data as {
        token: string;
        id: string;
        username: string;
      };

      await setSessionCookie(result.token);

      return NextResponse.json({
        account: {
          id: result.id,
          username: result.username,
        },
      });
    }

    if (action === "sign_out") {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE)?.value;

      if (token) {
        await supabase.rpc("delete_account_session", {
          p_token: token,
        });
      }

      cookieStore.set(SESSION_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Unknown authentication action." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ account: null });
    }

    const { data, error } = await supabase.rpc("get_session_account", {
      p_token: token,
    });

    if (error || !data) {
      return NextResponse.json({ account: null });
    }

    return NextResponse.json({ account: data });
  } catch {
    return NextResponse.json({ account: null });
  }
}
