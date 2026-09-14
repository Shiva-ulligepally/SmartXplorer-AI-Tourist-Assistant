// Follow this setup guide to integrate the Deno standard library into your Edge Function.
// See https://deno.land/manual/node/npm_packages for more information!
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER"); // WhatsApp-enabled Twilio number (format: whatsapp:+1234567890)

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Helper function to send SMS via Twilio
async function sendTwilioSMS(toPhone: string, message: string): Promise<boolean> {
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.error(
      "[SMS] Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER"
    );
    return false;
  }

  try {
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: twilioPhoneNumber,
          To: toPhone,
          Body: message,
        }).toString(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[SMS] Twilio API error:", error);
      return false;
    }

    const result = await response.json();
    console.log("[SMS] Message sent successfully. SID:", result.sid);
    return true;
  } catch (error) {
    console.error("[SMS] Error sending SMS via Twilio:", error);
    return false;
  }
}

// Helper function to send WhatsApp message via Twilio
async function sendTwilioWhatsApp(toPhone: string, message: string): Promise<boolean> {
  if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
    console.error(
      "[WhatsApp] Twilio WhatsApp not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER"
    );
    return false;
  }

  try {
    // Format: whatsapp:+1234567890
    const toPhoneFormatted = toPhone.startsWith("whatsapp:") ? toPhone : `whatsapp:${toPhone}`;
    const fromPhoneFormatted = twilioWhatsAppNumber.startsWith("whatsapp:") ? twilioWhatsAppNumber : `whatsapp:${twilioWhatsAppNumber}`;

    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromPhoneFormatted,
          To: toPhoneFormatted,
          Body: message,
        }).toString(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[WhatsApp] Twilio API error:", error);
      return false;
    }

    const result = await response.json();
    console.log("[WhatsApp] Message sent successfully. SID:", result.sid);
    return true;
  } catch (error) {
    console.error("[WhatsApp] Error sending WhatsApp via Twilio:", error);
    return false;
  }
}

// Main handler for the Edge Function
Deno.serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        },
      });
    }

    // Parse request body
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: "Missing phone or message" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[SMS] Sending message to ${phone}`);

    // Send SMS via Twilio
    const success = await sendTwilioSMS(phone, message);

    if (success) {
      // Optionally log the SMS attempt to the database
      try {
        const { error: logError } = await supabase.from("sms_logs").insert({
          phone_number: phone,
          message: message,
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        if (logError) {
          console.warn("[SMS] Error logging SMS to database:", logError);
        }
      } catch (logErr) {
        console.warn("[SMS] Error logging SMS:", logErr);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "SMS sent successfully",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send SMS",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error("[SMS] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

/* To invoke locally:

  1. Uncomment the import at the top of the file
  2. Save the file (migrations will be deployed when you run `supabase push`)
  3. Run this TypeScript file directly with `deno run --allow-all ./functions/send-sms/index.ts`

  To send SMS via cURL:

  curl -i --location --request POST 'http://localhost:54321/functions/v1/send-sms' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhdWQiOiJzdXBhYmFzZS1kZW1vIiwiZXhwIjoxNzAzODk4MjI4fQ.CRXP3sSAmWjsk_Xyc3LXw5OdamHsN3rEbKJ3rAnKUEw' \
    --header 'Content-Type: application/json' \
    --data '{"phone":"+14155552671","message":"Hello from Smart Journey Hub SOS!"}'

*/
