// routes/saved_routes.js
import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST a new saved route for the authenticated user
router.post("/", async (req, res) => {
  // 1. Get the user's access token from the request header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication token is required" });
  }
  const token = authHeader.split(" ")[1];

  try {
    // 2. Securely get the user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // 3. Get route data from the request body
    const { name, from_address, to_address, polyline } = req.body;
    if (!name || !from_address || !to_address || !polyline) {
      return res.status(400).json({ error: "Missing required route data" });
    }

    // 4. Insert the new route into the database, linking it to the user
    const { data, error } = await supabase
      .from("saved_routes")
      .insert([{
        profile_id: user.id, // Link to the authenticated user
        name,
        from_address,
        to_address,
        polyline,
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
