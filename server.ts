import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Reseller API proxy endpoint
  app.post("/api/reseller/order", async (req, res) => {
    try {
      const { uid, productCode, quantity } = req.body;

      if (!uid || !productCode || !quantity) {
        return res.status(400).json({ error: "Missing required fields: uid, productCode, quantity" });
      }

      const apiUrl = process.env.RESELLER_API_URL;
      const apiKey = process.env.RESELLER_API_KEY;

      if (!apiUrl || !apiKey) {
        console.error("Reseller API credentials not configured.");
        // We still return success to the client if API is not configured so it doesn't crash, 
        // or we return a specific error so the admin knows.
        return res.status(500).json({ error: "Reseller API not configured on server." });
      }

      console.log(`Sending order to Reseller API. ProductCode: ${productCode}, UID: ${uid}, Quantity: ${quantity}`);

      // Sample API Request Format handling. 
      // Assuming a generic JSON POST, adjust if the sample format is different.
      // Usually these APIs take form data or JSON. We will use JSON by default, 
      // but if the user provided a sample format we should match it. 
      // The instructions say: "I will provide: Sample API Request Format", but they didn't provide it yet.
      // So we will implement a standard JSON POST request.
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Api-Key": apiKey
        },
        body: JSON.stringify({
          uid: uid,
          productCode: productCode,
          quantity: quantity
        })
      });

      const data = await response.text();
      console.log("Reseller API response:", data);

      if (!response.ok) {
        return res.status(response.status).json({ error: "Reseller API error", details: data });
      }

      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        parsedData = { raw: data };
      }

      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error("Error calling Reseller API:", error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  });

  // Vite middleware for development
  app.post("/api/check-freefire-name", async (req, res) => {
    try {
      const { uid } = req.body;
      if (!uid) {
        return res.status(400).json({ error: "Missing uid" });
      }

      const response = await fetch(`https://apis.rrrtopup.com/api/v1/player-nickname?id=${uid}&product_id=21`);
      const data = await response.json();

      if (response.ok && data?.success) {
        return res.json({ success: true, name: data.data.nickname });
      } else {
        return res.json({ success: false, name: "❌ আপনার Uid ভুল" });
      }
    } catch (error: any) {
      console.error("Error checking Free Fire name:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
