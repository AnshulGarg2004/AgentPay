import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy_key_for_scaffolding" });

// Updated active Groq models for 2026 API
export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";