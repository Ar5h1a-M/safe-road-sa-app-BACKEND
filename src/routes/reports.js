// routes/reports.js
import express from "express"
import { createClient } from "@supabase/supabase-js"
import multer from "multer"

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() }) // handle file uploads

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Utility: upload multiple files to Supabase
async function uploadFiles(files, type, reportId) {
  const urls = []

  for (const file of files) {
    const filePath = `${type}/${reportId}/${Date.now()}-${file.originalname}`
    const { error: uploadError } = await supabase.storage
      .from("reports")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: publicUrl } = supabase.storage
      .from("reports")
      .getPublicUrl(filePath)

    urls.push(publicUrl.publicUrl)
  }

  return urls
}

// ----------------- Road Hazards -----------------
router.post("/hazard", upload.array("photos"), async (req, res) => {
  const { hazard_type, severity, location, description } = req.body

  const { data, error } = await supabase
    .from("road_hazards")
    .insert([{ hazard_type, severity, location, description }])
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  let photo_urls = []

  if (req.files?.length) {
    try {
      photo_urls = await uploadFiles(req.files, "hazards", data.id)
      await supabase
        .from("road_hazards")
        .update({ photo_url: photo_urls })
        .eq("id", data.id)
    } catch (err) {
      console.error("File upload failed:", err)
    }
  }

  res.json({ ...data, photo_url: photo_urls })
})

// ----------------- Infrastructure -----------------
router.post("/infrastructure", upload.array("photos"), async (req, res) => {
  const { request_type, priority, location, justification } = req.body

  const { data, error } = await supabase
    .from("infrastructure_requests")
    .insert([{ request_type, priority, location, justification }])
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  let photo_urls = []

  if (req.files?.length) {
    try {
      photo_urls = await uploadFiles(req.files, "infrastructure", data.id)
      await supabase
        .from("infrastructure_requests")
        .update({ photo_url: photo_urls })
        .eq("id", data.id)
    } catch (err) {
      console.error("File upload failed:", err)
    }
  }

  res.json({ ...data, photo_url: photo_urls })
})

// ----------------- Traffic Light -----------------
router.post("/traffic-light", async (req, res) => {
  const { fault_type, affected_lanes, intersection, traffic_impact } = req.body

  const { data, error } = await supabase
    .from("traffic_light_reports")
    .insert([{ fault_type, affected_lanes, intersection, traffic_impact }])
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  res.json(data)
})

// ----------------- Emergency -----------------
router.post("/emergency", async (req, res) => {
  const { request_type, location, description, contact_number } = req.body

  const { data, error } = await supabase
    .from("emergency_requests")
    .insert([{ request_type, location, description, contact_number }])
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  res.json(data)
})

// GET all reports
router.get("/", async (req, res) => {
  try {
    const { data: hazards, error: hazardsError } = await supabase
      .from("road_hazards")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: infrastructure, error: infrastructureError } = await supabase
      .from("infrastructure_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: trafficLights, error: trafficLightsError } = await supabase
      .from("traffic_light_reports")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: emergencies, error: emergenciesError } = await supabase
      .from("emergency_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (hazardsError || infrastructureError || trafficLightsError || emergenciesError) {
      return res.status(500).json({ error: "Failed to fetch reports" });
    }

    res.json({
      road_hazards: hazards,
      infrastructure_requests: infrastructure,
      traffic_light_reports: trafficLights,
      emergency_requests: emergencies
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET specific report types
router.get("/hazards", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("road_hazards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/infrastructure", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("infrastructure_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/traffic-lights", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("traffic_light_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/emergencies", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("emergency_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router
