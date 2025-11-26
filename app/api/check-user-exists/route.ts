import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Try to sign in with a dummy password to check if email exists
    // This is the most reliable way to check without sending emails
    const { error: signInError, data: signInData } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: "dummy_check_password_12345!@#$%_check_only",
      });

    // If sign-in returns a user (even with wrong password), email definitely exists
    // This shouldn't happen, but if it does, email exists
    if (signInData?.user) {
      return NextResponse.json({ exists: true });
    }

    // Check the error message
    if (signInError) {
      const errorMsg = signInError.message.toLowerCase();

      // These errors indicate the email exists (password is wrong, but email is registered)
      if (
        errorMsg.includes("invalid login credentials") ||
        errorMsg.includes("email not confirmed") ||
        errorMsg.includes("invalid email or password") ||
        errorMsg.includes("incorrect password")
      ) {
        return NextResponse.json({ exists: true });
      }

      // If error says user not found or email doesn't exist, email doesn't exist
      if (
        errorMsg.includes("user not found") ||
        errorMsg.includes("email not found") ||
        errorMsg.includes("no user found")
      ) {
        return NextResponse.json({ exists: false });
      }
    }

    // Default: if we can't determine, assume email doesn't exist
    // The actual signup will catch real duplicates
    return NextResponse.json({ exists: false });
  } catch (error: any) {
    console.error("Error checking user exists:", error);
    // On error, assume email doesn't exist to allow signup attempt
    // The actual signup will catch real duplicates
    return NextResponse.json({ exists: false });
  }
}
