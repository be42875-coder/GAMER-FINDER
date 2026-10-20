
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({
      ok: false,
      error: "Missing Telegram configuration"
    });
  }

  let body = req.body;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({
        ok: false,
        error: "Invalid JSON"
      });
    }
  }

  const title = typeof body?.title === "string"
    ? body.title.trim()
    : "";
  const content = typeof body?.content === "string"
    ? body.content.trim()
    : "";

  if (!title || !content) {
    return res.status(400).json({
      ok: false,
      error: "Title and content are required"
    });
  }

  const escapeHtml = (s) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(content)}`,
          parse_mode: "HTML",
          disable_web_page_preview: true
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      console.error("Telegram send failed:", result.description);
      return res.status(502).json({
        ok: false,
        error: "Telegram could not send the message"
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram request failed:", error.message);
    return res.status(502).json({
      ok: false,
      error: "Telegram request failed"
    });
  }
};
