import { groq, GROQ_MODEL } from "../../config/groq.js";

/**
 * Validate and sanitize structured intent output from LLM.
 * Guarantees zero invalid data, negative numbers, or missing types enter the system.
 */
export function validateStructuredIntent(raw, originalPrompt = "") {
  if (!raw || typeof raw !== "object") {
    return parseIntentDeterministicFallback(originalPrompt);
  }

  // 1. Sanitize Category
  let category = typeof raw.category === "string" ? raw.category.toLowerCase().trim() : "";
  if (!category) {
    category = inferCategoryFromPrompt(originalPrompt);
  }

  // 2. Sanitize Quantity
  let quantity = Number(raw.quantity);
  if (isNaN(quantity) || quantity <= 0) {
    const qtyMatch = originalPrompt.match(/(\d+)\s*(units?|pcs?|items?|chairs?|laptops?|monitors?|keyboards?)/i);
    quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
  }

  // 3. Sanitize Max Unit Price in Paise
  let maxUnitPriceInPaise = Number(raw.maxUnitPriceInPaise);
  if (isNaN(maxUnitPriceInPaise) || maxUnitPriceInPaise <= 0) {
    // Check if maxUnitPrice or budget was given in rupees in LLM response
    if (raw.maxUnitPrice && Number(raw.maxUnitPrice) > 0) {
      maxUnitPriceInPaise = Math.round(Number(raw.maxUnitPrice) * 100);
    } else {
      const rupeeMatch = originalPrompt.match(/(?:under|below|max|budget of|\u20b9|rs\.?|inr)\s*([\d,]+)/i);
      if (rupeeMatch) {
        const val = parseInt(rupeeMatch[1].replace(/,/g, ""), 10);
        maxUnitPriceInPaise = val > 0 ? val * 100 : null;
      } else {
        maxUnitPriceInPaise = null; // No upper limit specified
      }
    }
  }

  // 4. Sanitize Delivery Deadline (in days)
  let deliveryDeadline = Number(raw.deliveryDeadline || raw.requestedDeliveryDays);
  if (isNaN(deliveryDeadline) || deliveryDeadline <= 0) {
    const deliveryMatch = originalPrompt.match(/(?:within|in|under)\s*(\d+)\s*days/i);
    deliveryDeadline = deliveryMatch ? parseInt(deliveryMatch[1], 10) : null;
  }

  // 5. Sanitize Attributes Object
  const attributes = {};
  if (raw.attributes && typeof raw.attributes === "object" && !Array.isArray(raw.attributes)) {
    Object.entries(raw.attributes).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== "") {
        attributes[k.toLowerCase()] = typeof v === "string" ? v.toLowerCase() : v;
      }
    });
  }

  // Extract color from prompt if not captured
  if (!attributes.color) {
    const colorMatch = originalPrompt.match(/\b(black|white|charcoal|brown|grey|gray|silver|graphite)\b/i);
    if (colorMatch) {
      attributes.color = colorMatch[1].toLowerCase();
    }
  }

  // Extract specs (ergonomic, RAM, etc.)
  if (originalPrompt.toLowerCase().includes("ergonomic")) {
    attributes.ergonomic = true;
  }
  const ramMatch = originalPrompt.match(/(\d+\s*gb)\s*ram/i);
  if (ramMatch) {
    attributes.ram = ramMatch[1].toLowerCase();
  }

  return {
    category,
    quantity: Math.max(1, quantity),
    maxUnitPriceInPaise: maxUnitPriceInPaise && maxUnitPriceInPaise > 0 ? maxUnitPriceInPaise : null,
    attributes,
    deliveryDeadline: deliveryDeadline && deliveryDeadline > 0 ? deliveryDeadline : null,
  };
}

/**
 * Deterministic keyword fallback parser when LLM is unavailable.
 */
function parseIntentDeterministicFallback(prompt = "") {
  const p = prompt.toLowerCase();
  const category = inferCategoryFromPrompt(p);

  const qtyMatch = p.match(/(\d+)\s*(units?|pcs?|items?|chairs?|laptops?|monitors?|keyboards?)/i) || p.match(/^(\d+)/);
  const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

  const priceMatch = p.match(/(?:under|below|max|budget of|\u20b9|rs\.?|inr)\s*([\d,]+)/i);
  const maxUnitPriceInPaise = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ""), 10) * 100 : null;

  const deliveryMatch = p.match(/(?:within|in|under)\s*(\d+)\s*days/i);
  const deliveryDeadline = deliveryMatch ? parseInt(deliveryMatch[1], 10) : null;

  const attributes = {};
  const colorMatch = p.match(/\b(black|white|charcoal|brown|grey|gray|silver|graphite)\b/i);
  if (colorMatch) attributes.color = colorMatch[1].toLowerCase();
  if (p.includes("ergonomic")) attributes.ergonomic = true;

  const ramMatch = p.match(/(\d+\s*gb)\s*ram/i);
  if (ramMatch) attributes.ram = ramMatch[1].toLowerCase();

  return {
    category,
    quantity: Math.max(1, quantity),
    maxUnitPriceInPaise,
    attributes,
    deliveryDeadline,
  };
}

function inferCategoryFromPrompt(prompt = "") {
  const p = prompt.toLowerCase();
  if (p.includes("chair")) return "chairs";
  if (p.includes("monitor") || p.includes("screen") || p.includes("display")) return "monitors";
  if (p.includes("laptop") || p.includes("notebook") || p.includes("macbook")) return "laptops";
  if (p.includes("keyboard") || p.includes("mouse")) return "keyboards";
  if (p.includes("dock") || p.includes("hub")) return "docking stations";
  if (p.includes("mount") || p.includes("arm") || p.includes("stand")) return "accessories";
  return "all";
}

/**
 * Parse natural language request into validated structured intent.
 * Read-only. Does not mutate database or authorize financial transactions.
 */
export async function parseBuyerIntent(promptText) {
  if (!promptText || typeof promptText !== "string" || !promptText.trim()) {
    throw new Error("Prompt text is required for buyer intent parsing");
  }

  const prompt = promptText.trim();
  const modelCandidates = Array.from(
    new Set([GROQ_MODEL, "openai/gpt-oss-120b", "qwen/qwen3.6-27b", "groq/compound"])
  );

  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "xxxxx") {
    for (const modelCandidate of modelCandidates) {
      try {
        const systemPrompt = `
You are the AgentPay Buyer Intent AI Agent. Your ONLY job is to convert messy human natural-language purchasing requests into a strict structured JSON intent schema.

Output Schema strictly as JSON:
{
  "category": string (e.g. "chairs", "monitors", "laptops", "keyboards", "docking stations", "accessories"),
  "quantity": number (integer, quantity requested by buyer),
  "maxUnitPriceInPaise": number (integer in paise, e.g. ₹7,500 = 750000 paise. Null if no price limit),
  "attributes": {
    "color": string | null,
    "ergonomic": boolean | null,
    "ram": string | null,
    "screenSize": string | null
  },
  "deliveryDeadline": number (integer days requested. Null if not specified)
}
`;

        const completion = await groq.chat.completions.create({
          model: modelCandidate,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Parse this purchasing request: "${prompt}"` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        });

        const rawContent = completion.choices[0]?.message?.content || "";
        const cleanedContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedJson = JSON.parse(cleanedContent);

        const validated = validateStructuredIntent(parsedJson, prompt);
        return validated;
      } catch (err) {
        if (err.message?.includes("not exist") || err.message?.includes("decommissioned") || err.status === 404) {
          continue;
        }
        console.warn(`Groq buyerIntentAgent model '${modelCandidate}' warning:`, err.message);
      }
    }
  }

  // Fallback to deterministic parser
  return parseIntentDeterministicFallback(prompt);
}

export const buyerIntentAgent = {
  parseBuyerIntent,
  validateStructuredIntent,
};
