import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

export const app = express();
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
        return res.status(500).json({ error: "Reseller API not configured on server." });
      }

      // Validate URL
      try {
        new URL(apiUrl);
      } catch (e) {
        console.error("Invalid RESELLER_API_URL configured:", apiUrl);
        return res.status(500).json({ error: "Invalid Reseller API URL configured on server." });
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

      // Use the provided API as default, or allow override via ENV
      let configUrl = process.env.FREEFIRE_CHECK_URL || "https://apis.rrrtopup.com/api/v1/player-nickname?id={uid}&product_id=21";
      
      let fetchUrl = configUrl.replace('{uid}', uid).replace('{id}', uid);
      
      // If the URL doesn't have placeholders, append the ID
      if (fetchUrl === configUrl) {
        fetchUrl = configUrl.includes('?') ? `${configUrl}&id=${uid}` : `${configUrl}?id=${uid}`;
      }

      console.log(`Checking Free Fire name for UID: ${uid} via ${fetchUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const response = await fetch(fetchUrl, { 
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          if (response.ok && text && text.length < 50 && !text.includes('<html')) {
             return res.json({ success: true, name: text.trim() });
          }
          return res.status(500).json({ success: false, name: "❌ Server Error: Invalid API response" });
        }

        // Check various common fields for nickname
        const name = data.nickname || data.name || data.player_name || data.player_nickname || (data.data && (data.data.nickname || data.data.name));
        
        if (response.ok && (data.success || data.status === "success" || name)) {
          return res.json({ success: true, name: name || "Valid ID" });
        }
        
        const errorMsg = data.message || data.error || "❌ আপনার Uid ভুল";
        return res.status(response.ok ? 200 : response.status).json({ success: false, name: errorMsg });
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') return res.status(504).json({ success: false, name: "❌ API Timeout" });
        return res.status(500).json({ success: false, name: `❌ Network Error: ${err.message}` });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, name: "❌ Internal Error" });
    }
  });

(async () => {
  if (process.env.NODE_ENV !== "production" && !process.env.NETLIFY) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.NETLIFY) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.NETLIFY) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
})();
