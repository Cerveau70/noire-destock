// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

serve(async (req) => {
  try {
    const { imageUrl } = await req.json();
    const apiKey = Deno.env.get("GOOGLE_VISION_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, message: "GOOGLE_VISION_API_KEY manquante." }), { status: 400 });
    }
    if (!imageUrl) {
      return new Response(JSON.stringify({ success: false, message: "imageUrl manquant." }), { status: 400 });
    }

    const visionRes = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: imageUrl } },
          features: [{ type: "TEXT_DETECTION" }]
        }]
      })
    });

    const visionData: any = await visionRes.json();
    const text = visionData?.responses?.[0]?.fullTextAnnotation?.text || "";

    const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const findLine = (key: string) => lines.find((l: string) => l.toUpperCase().includes(key));

    const nameLine = findLine("NOM");
    const prenomLine = findLine("PRENOM") || findLine("PRÉNOM");
    const cniLine = findLine("CNI") || findLine("CARTE");
    const birthLine = findLine("NAISS") || findLine("NÉ");

    const extractValue = (line?: string) => {
      if (!line) return "";
      const parts = line.split(":");
      return parts.length > 1 ? parts.slice(1).join(":").trim() : line.replace(/(NOM|PRENOM|PRÉNOM|CNI|CARTE|NAISS|NÉ)/i, "").trim();
    };

    const fullName = [extractValue(nameLine), extractValue(prenomLine)].filter(Boolean).join(" ").trim();
    const cniNumberMatch = text.match(/(?:CNI|CARTE)\s*[:\-]?\s*([A-Z0-9\-]+)/i);
    const birthDateMatch = text.match(/(0[1-9]|[12][0-9]|3[01])[\/\.\-](0[1-9]|1[0-2])[\/\.\-](19|20)\d{2}/);

    return new Response(JSON.stringify({
      success: true,
      rawText: text,
      fields: {
        fullName: fullName || extractValue(nameLine),
        cniNumber: cniNumberMatch?.[1] || extractValue(cniLine),
        birthDate: birthDateMatch?.[0] || extractValue(birthLine)
      }
    }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: "Erreur OCR", error: String(e) }), { status: 500 });
  }
});
