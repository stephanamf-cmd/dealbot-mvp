import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { inputSchema } from "@/lib/schema";
import { evaluateDeal } from "@/lib/decisionEngine";

// Force Node runtime (so fs works reliably)
export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function loadConfig() {
  const p = path.join(process.cwd(), "config", "config.json");
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export async function POST(req: Request) {
  try {
    // 1) Validate env
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { type: "error", text: "Server misconfigured: OPENAI_API_KEY is missing." },
        { status: 500 }
      );
    }

    // 2) Validate payload
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { type: "error", text: "Invalid request: expected { messages: [...] }" },
        { status: 400 }
      );
    }

    const system = `
You are a strict deal intake assistant.
Collect ONLY: purchase price, annual NOI, and market type (primary/secondary/tertiary).
If input is missing/ambiguous, ask ONE short clarifying question.
Never provide valuation, ranges, recommendations, or commentary.
`.trim();

    const completion = await openai.chat.completions.create({
      // Use a very commonly available model name:
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0,
      messages: [{ role: "system", content: system }, ...body.messages],
      tools: [{ type: "function", function: inputSchema }],
      tool_choice: "auto"
    });

    const msg = completion.choices[0]?.message;
    const toolCall = msg?.tool_calls?.[0];

    // If no tool-call, assistant asked a question
    if (!toolCall) {
      return NextResponse.json({
        type: "question",
        text: msg?.content || "Please provide purchase price, annual NOI, and market type."
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
	
	console.log("REQUEST BODY:", body);
	console.log("MESSAGES TYPE:", Array.isArray(body?.messages), typeof body?.messages);

    const config = loadConfig();
    const decision = evaluateDeal(args, config);

    const lines = [
      `DEAL WORTH: $${decision.dealWorth.toLocaleString("en-US")}`,
      `PRICING: ${decision.pricingLabel}`,
      `RECOMMENDATION: ${decision.recommendation}`
    ];

    if (decision.recommendation === "MAKE_AN_OFFER" && decision.offerPrice) {
      lines.push(`OFFER: $${decision.offerPrice.toLocaleString("en-US")}`);
    }

    return NextResponse.json({
      type: "result",
      decision,
      text: lines.join("\n")
    });
  } catch (err: any) {
  console.error("API /api/chat crash:", err);

  return NextResponse.json(
    {
      type: "error",
      text: "Server error in /api/chat.",
      details: err?.message || String(err),
      name: err?.name,
      stack: (err?.stack || "").split("\n").slice(0, 6).join("\n")
    },
    { status: 500 }
	);
	}
}
