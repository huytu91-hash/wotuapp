export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Thiếu mô tả nhu cầu" });
    const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) return res.status(503).json({ error: "Chưa cấu hình GEMINI_API_KEY trên môi trường đang chạy." });
    const body = { contents: [{ parts: [{ text: "Bạn là chuyên gia tư vấn nội thất WOTU tại Việt Nam. Hãy phân tích nhu cầu sau và trả lời bằng tiếng Việt, tối đa 5 gạch đầu dòng: phòng/khu vực, kích thước giả định, vật liệu phù hợp, phụ kiện nên có, lưu ý cần xác nhận khi khảo sát. Không tự bịa giá. Nhu cầu khách: " + prompt }] }] };
    // Use models served by Google's Generative Language API. The UI error mentioning
    // gemini-3.6-flash is from a different provider and is not a valid direct REST model.
    const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
    let lastError = "";
    for (const model of models) {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return res.status(200).json({ text });
      }
      lastError = data.error?.message || "Gemini không phản hồi";
      if (response.status !== 404 && response.status !== 400) break;
    }
    return res.status(502).json({ error: "AI đang tạm thời không khả dụng. Phương án tự động vẫn dùng được." });
  } catch (error) {
    return res.status(500).json({ error: "Không thể kết nối Gemini" });
  }
}
