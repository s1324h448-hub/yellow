// TikTok Events API — Vercel Serverless Function
// Pixel: D7EB5URC77UDSGCE2100 (Yellowx888)

const TT_PIXEL_ID = "D7EB5URC77UDSGCE2100";
const TT_ACCESS_TOKEN = "f8c78a9620cb06385339c0356246e582a1bc610c";
const TT_API_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const body = req.body || {};
        const {
            event_name,
            event_time,
            event_id,
            event_source_url,
            contents = [],
            user_data = {},
            test_event_code
        } = body;

        if (!event_name) return res.status(400).json({ error: "event_name required" });

        const ttUserData = {};
        if (user_data.ttclid)      ttUserData.ttclid = user_data.ttclid;
        if (user_data.external_id) ttUserData.external_id = [user_data.external_id];
        if (user_data.ip)          ttUserData.ip = user_data.ip;
        if (user_data.user_agent)  ttUserData.user_agent = user_data.user_agent;

        if (!ttUserData.ip) {
            const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
                    || req.headers["x-real-ip"]
                    || "";
            if (ip) ttUserData.ip = ip;
        }

        if (!ttUserData.user_agent) {
            const ua = req.headers["user-agent"] || "";
            if (ua) ttUserData.user_agent = ua;
        }

        // TikTok Events API v1.3 — ใช้ event_source_id + data array (format ถูกต้อง)
        const payload = {
            event_source: "web",
            event_source_id: TT_PIXEL_ID,
            test_event_code: test_event_code || undefined,
            data: [
                {
                    event: event_name,
                    event_time: event_time || Math.floor(Date.now() / 1000),
                    event_id: event_id || `${event_name}_${Date.now()}`,
                    event_source_url: event_source_url || "",
                    user: ttUserData,
                    properties: contents.length > 0 ? { contents } : {}
                }
            ]
        };

        const ttRes = await fetch(TT_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Access-Token": TT_ACCESS_TOKEN
            },
            body: JSON.stringify(payload)
        });

        const ttData = await ttRes.json();
        console.log("TikTok CAPI response:", JSON.stringify(ttData));
        return res.status(200).json({ ok: true, tt: ttData });

    } catch (err) {
        console.error("TT CAPI error:", err);
        return res.status(500).json({ error: err.message });
    }
}
