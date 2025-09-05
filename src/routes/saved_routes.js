// routes/saved_routes.js
import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST a new saved route (anonymous)
router.post("/", async (req, res) => {

  try {
    // 1. Get route data from the request body
    const { name, from_address, to_address, polyline } = req.body;
    if (!name || !from_address || !to_address || !polyline) {
      return res.status(400).json({ error: "Missing required route data" });
    }

    // 2. Insert the new route into the database (without a profile_id)
    const { data, error } = await supabase
      .from("saved_routes")
      .insert([{
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