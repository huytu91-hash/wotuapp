export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Thiếu mô tả nhu cầu" });
    const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) return res.status(503).json({ error: "Chưa cấu hình GEMINI_API_KEY trên môi trường đang chạy." });
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + encodeURIComponent(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Bạn là chuyên gia tư vấn nội thất WOTU tại Việt Nam. Hãy phân tích nhu cầu sau và trả lời bằng tiếng Việt, tối đa 5 gạch đầu dòng: phòng/khu vực, kích thước giả định, vật liệu phù hợp, phụ kiện nên có, lưu ý cần xác nhận khi khảo sát. Không tự bịa giá. Nhu cầu khách: " + prompt }] }] })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || "Gemini không phản hồi" });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Chưa có nhận xét từ Gemini.";
    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: "Không thể kết nối Gemini" });
  }
}
