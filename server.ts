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
      const { uid, apiUrl, apiKey } = req.body;
      if (!uid) {
        return res.status(400).json({ error: "Missing uid" });
      }

      let fetchUrl = `https://apis.rrrtopup.com/api/v1/player-nickname?id=${uid}&product_id=21`;
      let headers: any = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://apis.rrrtopup.com/'
      };

      if (apiUrl) {
        // Basic validation for apiUrl
        if (!apiUrl.startsWith('http')) {
          console.warn("Invalid API URL provided:", apiUrl);
          return res.status(400).json({ success: false, name: "❌ Invalid API URL configured" });
        }

        // Replace {uid} or {id} in the custom URL if it's templated, or just append it
        if (apiUrl.includes('{uid}')) {
          fetchUrl = apiUrl.replace('{uid}', uid);
        } else if (apiUrl.includes('{id}')) {
          fetchUrl = apiUrl.replace('{id}', uid);
        } else {
          // If no template, try to append it or use it as is if it already has parameters
          fetchUrl = apiUrl.includes('?') ? `${apiUrl}&uid=${uid}` : `${apiUrl}?uid=${uid}`;
        }
        
        headers = {
          'Accept': 'application/json'
        };
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
          headers['X-Api-Key'] = apiKey; // Just send it in both common places
        }
      }

      // Final check for fetchUrl validity
      try {
        new URL(fetchUrl);
      } catch (e) {
        console.error("Invalid constructed fetch URL:", fetchUrl);
        return res.status(400).json({ success: false, name: "❌ Invalid API URL Configuration" });
      }

      console.log(`Checking Free Fire name for UID: ${uid} via ${fetchUrl}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // Increased to 12s

      try {
        const response = await fetch(fetchUrl, { 
          headers,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const contentType = response.headers.get("content-type");
        const text = await response.text();
        
        console.log(`API Response Status: ${response.status}, Content-Type: ${contentType}`);
        
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse API response as JSON. Raw response:", text);
          // If it's not JSON, maybe it's just the name as plain text?
          if (response.ok && text && text.length < 50 && !text.includes('<html')) {
             return res.json({ success: true, name: text.trim() });
          }
          return res.status(500).json({ success: false, name: "❌ Server Error: Invalid API response format" });
        }

        if (response.ok && (data?.success || data?.status === "success" || data?.player_name || data?.nickname || data?.name || (data?.data && (data.data.nickname || data.data.name)))) {
          // Different APIs return the name in different fields
          let name = data.name || data.nickname || data.player_name || (data.data && (data.data.nickname || data.data.name));
          
          if (!name && data.success) name = "Valid ID (Name hidden)";
          
          if (name) {
            return res.json({ success: true, name: name });
          }
        }
        
        console.warn("API check failed or name not found in data:", data);
        const errorMsg = data?.message || data?.error || data?.data?.message || "❌ আপনার Uid ভুল";
        return res.status(response.ok ? 200 : response.status).json({ success: false, name: errorMsg });
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error("Fetch error during name check:", err);
        if (err.name === 'AbortError') {
          return res.status(504).json({ success: false, name: "❌ API Timeout (Slow response)" });
        }
        return res.status(500).json({ success: false, name: `❌ Network Error: ${err.message}` });
      }
    } catch (error: any) {
      console.error("Critical error in check-freefire-name route:", error);
      res.status(500).json({ success: false, name: "❌ Internal Server Error", message: error.message });
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
