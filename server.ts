import express from "express";
import path from "path";

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

      console.log(`Sending order to Reseller API. ProductCode: ${productCode}, UID: ${uid}, Quantity: ${quantity}`);
      
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

  // Free Fire Name Check API
  app.post("/api/check-freefire-name", async (req, res) => {
    try {
      const { uid } = req.body;
      if (!uid) {
        return res.status(400).json({ error: "Missing uid" });
      }

      const configUrl = process.env.FREEFIRE_CHECK_URL || "https://apis.rrrtopup.com/api/v1/player-nickname?id={uid}&product_id=21";
      let fetchUrl = configUrl.replace('{uid}', uid).replace('{id}', uid);
      
      if (fetchUrl === configUrl) {
        fetchUrl = configUrl.includes('?') ? `${configUrl}&id=${uid}` : `${configUrl}?id=${uid}`;
      }

      console.log(`Checking Free Fire name for UID: ${uid}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      try {
        const response = await fetch(fetchUrl, { 
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://apis.rrrtopup.com',
            'Referer': 'https://apis.rrrtopup.com/'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const text = await response.text();
        
        if (!response.ok) {
           console.error(`API Error Status ${response.status}:`, text);
           return res.status(response.status).json({ success: false, name: "❌ API Connection Error" });
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          if (text && text.length < 50 && !text.includes('<html')) {
             return res.json({ success: true, name: text.trim() });
          }
          console.error("Invalid JSON response:", text);
          return res.status(500).json({ success: false, name: "❌ Invalid API Format" });
        }

        const name = data.nickname || data.name || data.player_name || data.player_nickname || (data.data && (data.data.nickname || data.data.name));
        
        if (data.success || data.status === "success" || name) {
          return res.json({ success: true, name: name || "Valid ID" });
        }
        
        const errorMsg = data.message || data.error || "❌ আপনার Uid ভুল";
        return res.json({ success: false, name: errorMsg });
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error("Fetch failure:", err.message);
        if (err.name === 'AbortError') return res.status(504).json({ success: false, name: "❌ API Timeout" });
        return res.status(500).json({ success: false, name: `❌ Network Error` });
      }
    } catch (error: any) {
      console.error("Critical server error:", error);
      res.status(500).json({ success: false, name: "❌ Internal Server Error" });
    }
  });

// Setup dev/prod servers
if (!process.env.NETLIFY) {
  (async () => {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
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
  })();
}
