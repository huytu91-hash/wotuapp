export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Thiếu mô tả nhu cầu" });
    const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) return res.status(503).json({ error: "Chưa cấu hình GEMINI_API_KEY trên môi trường đang chạy." });
    const body = { contents: [{ parts: [{ text: "Bạn là chuyên gia tư vấn nội thất WOTU tại Việt Nam. Hãy phân tích nhu cầu sau và trả lời bằng tiếng Việt, tối đa 5 gạch đầu dòng: phòng/khu vực, kích thước giả định, vật liệu phù hợp, phụ kiện nên có, lưu ý cần xác nhận khi khảo sát. Không tự bịa giá. Nhu cầu khách: " + prompt }] }] };
    // Ask Google's API which models this key can actually use. This avoids stale
    // model names from older deployments and automatically follows model changes.
    const catalogResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + encodeURIComponent(apiKey));
    const catalog = await catalogResponse.json().catch(() => ({}));
    if (!catalogResponse.ok) {
      return res.status(502).json({ error: "Gemini không chấp nhận API key hoặc key chưa bật Generative Language API." });
    }
    const available = (catalog.models || [])
      .filter((model) => (model.supportedGenerationMethods || []).includes("generateContent"))
      .map((model) => String(model.name || "").replace(/^models\//, ""));
    const preferred = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];
    const models = preferred.filter((model) => available.includes(model));
    if (!models.length) return res.status(502).json({ error: "API key không có model Gemini hỗ trợ generateContent." });
    for (const model of models) {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => ({}));
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (response.ok && text) return res.status(200).json({ text });
      if (response.status === 401 || response.status === 403) return res.status(502).json({ error: "Gemini từ chối API key. Hãy kiểm tra key đúng project và đã bật Generative Language API." });
    }
    return res.status(502).json({ error: "Gemini không tạo được phản hồi với các model đang khả dụng. Phương án tự động vẫn dùng được." });
  } catch (error) {
    return res.status(500).json({ error: "Không thể kết nối Gemini" });
  }
}
