export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Thiếu mô tả nhu cầu" });
    const text = prompt.trim().slice(0, 2000);
    if (!text) return res.status(400).json({ error: "Thiếu mô tả nhu cầu" });

    const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) return res.status(503).json({ error: "Chưa cấu hình GEMINI_API_KEY trên môi trường đang chạy." });

    const system = `Bạn là chuyên gia tư vấn nội thất WOTU (Quy Nhơn, Việt Nam).
Nhiệm vụ: đọc nhu cầu khách và trả về JSON đúng schema để app báo giá điền form.
Chỉ dùng mã vật liệu trong danh mục WOTU, không bịa giá.

Danh mục mã hợp lệ:
- Vật liệu tủ bếp/tủ áo/kệ: mdf_mel | ply_mel | mdf_acr | nhua_film | nhua_acr | nhua_lam
- Đá bếp: kimsa | su | lamar | khong
- Ốp kính/đá tường: k6 | kimsa | khong
- Kịch trần: full | khung | (chuỗi rỗng nếu không)
- Bồn rửa: "700" | "800" | ""
- Giường size: "14" | "16" | "18" | "20" | ""
- Phòng: bep, khach, an, master, n2, n3, tho

Quy tắc chọn vật liệu:
- Ngân sách tiết kiệm / phổ thông → mdf_mel
- Muốn bền/chống ẩm tốt hơn hoặc cao cấp vừa → ply_mel
- Cánh bóng/acrylic → mdf_acr (thùng vẫn mdf_mel nếu không nói rõ)
- Nhựa phủ màu → nhua_film
- Không rõ → mdf_mel

Schema JSON bắt buộc (không markdown, không giải thích ngoài JSON):
{
  "rooms": ["bep"],
  "kitchen": {
    "length_m": 3.2,
    "top_m": 3.2,
    "island_m": 0,
    "mat_bottom": "mdf_mel",
    "mat_top": "mdf_mel",
    "stone": "kimsa",
    "backsplash": "k6",
    "ceiling": "",
    "fridge_frame": "",
    "sink": "700",
    "led": true
  },
  "living": { "tv_m": 1.8, "tv_mat": "mdf_mel", "shoe_m2": 1.2, "shoe_mat": "mdf_mel", "shoe_acrylic": false },
  "dining": { "wine": "", "m2": 1.5 },
  "bedrooms": {
    "master": { "wardrobe_m2": 4, "mat": "mdf_mel", "aluminum_glass": false, "bed": "18", "bed_mat": "mdf_mel", "padded_head": false }
  },
  "advice": [
    "1 câu ngắn về khu vực đã chọn",
    "1 câu về vật liệu vì sao phù hợp",
    "1 lưu ý cần khảo sát thực tế"
  ],
  "summary": "1 câu tóm tắt phương án bằng tiếng Việt"
}

Chỉ điền field liên quan nhu cầu. rooms phải có ít nhất 1 phần tử nếu suy ra được. Số đo là number (mét hoặc m²).`;

    const bodyBase = {
      contents: [{ role: "user", parts: [{ text: "Nhu cầu khách:\n" + text }] }],
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 1024
      }
    };

    async function listModels() {
      try {
        const r = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models?key=" + encodeURIComponent(apiKey)
        );
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return [];
        return (data.models || [])
          .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
          .map((m) => String(m.name || "").replace(/^models\//, ""));
      } catch (_) {
        return [];
      }
    }

    const preferred = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-001",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-flash-001",
      "gemini-pro"
    ];

    let models = preferred.slice();
    const available = await listModels();
    if (available.length) {
      models = preferred.filter((m) => available.includes(m));
      if (!models.length) models = available.filter((m) => /flash/i.test(m));
      if (!models.length) models = available.slice(0, 5);
    }

    let lastError = "";
    for (const model of models) {
      for (const withJson of [true, false]) {
        const body = JSON.parse(JSON.stringify(bodyBase));
        if (withJson) body.generationConfig.responseMimeType = "application/json";
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/" +
            encodeURIComponent(model) +
            ":generateContent?key=" +
            encodeURIComponent(apiKey),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          }
        );
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          return res.status(502).json({
            error:
              "Gemini từ chối API key. Hãy kiểm tra key đúng project và đã bật Generative Language API."
          });
        }
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!response.ok || !rawText) {
          lastError = data.error?.message || "HTTP " + response.status;
          continue;
        }

        let plan = null;
        try {
          const cleaned = String(rawText)
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
          plan = JSON.parse(cleaned);
        } catch (_) {
          plan = null;
        }

        const advice = Array.isArray(plan?.advice)
          ? plan.advice.filter((x) => typeof x === "string" && x.trim()).slice(0, 5)
          : [];
        const summary =
          typeof plan?.summary === "string" && plan.summary.trim()
            ? plan.summary.trim()
            : advice[0] || String(rawText).slice(0, 400);

        return res.status(200).json({
          model,
          plan: plan && typeof plan === "object" ? plan : null,
          text: advice.length
            ? advice.map((line) => "• " + line.replace(/^[-•\s]+/, "")).join("\n")
            : summary,
          summary
        });
      }
    }

    return res.status(502).json({
      error:
        "Gemini không tạo được phản hồi với các model đang khả dụng. " +
        (lastError ? "(" + lastError + ") " : "") +
        "Phương án tự động vẫn dùng được."
    });
  } catch (error) {
    return res.status(500).json({ error: "Không thể kết nối Gemini" });
  }
}
