import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// SIGNUP: Create profile if it doesn't exist
router.post("/signup", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!accessToken) return res.status(400).json({ error: "Missing access token" });

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) return res.status(401).json({ error: "Invalid or expired token" });

    // Check if profile already exists
    const { data: existingProfile, error: selectError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Profile lookup error:", selectError);
      return res.status(500).json({ error: "Database error" });
    }

    if (!existingProfile) {
      // Insert new profile
      const { error: insertError } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name ?? null,
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        console.error("Insert error:", insertError);
        return res.status(500).json({ error: "Failed to create user profile" });
      }
    }

    return res.json({ message: "Signup/profile check successful" });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
