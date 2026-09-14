import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLang, targetLang } = await req.json();

    // Generic AI service key (provider-agnostic)
    const AI_API_KEY = Deno.env.get("AI_API_KEY");

    if (!AI_API_KEY) {
      throw new Error("AI_API_KEY is not configured");
    }

    // Abstracted AI endpoint (can be replaced later)
    const response = await fetch(
      "https://api.example-ai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "generic-llm-model",
          messages: [
            {
              role: "system",
              content: `You are a translator. Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text.`,
            },
            { role: "user", content: text },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI service error:", response.status, errorText);
      throw new Error("Translation failed");
    }

    const data = await response.json();
    const translation = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ translation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Translation error:", error);
    const message =
      error instanceof Error ? error.message : "Unexpected error";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});