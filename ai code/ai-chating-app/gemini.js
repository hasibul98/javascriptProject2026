const GeminiClient = (() => {
    const API_KEY = "";
    const MODEL = "gemini-3.5-flash";
    const SDK_URL = "https://esm.sh/@google/genai";

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    let sdkPromise = null;

    function loadSdk() {
        if (!sdkPromise) {
            sdkPromise = import(SDK_URL);
        }

        return sdkPromise;
    }

    function validateApiKey() {
        if (!API_KEY || API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
            throw new Error("Gemini API key missing. Add your key in gemini.js inside API_KEY.");
        }

        if (!API_KEY.startsWith("AIza")) {
            throw new Error("Gemini API key invalid. Google AI Studio API key usually starts with AIza. Please paste the correct key in gemini.js.");
        }
    }

    function getImagePart(image) {
        if (!image?.dataUrl) return null;

        const [meta, data] = image.dataUrl.split(",");
        const mimeMatch = meta.match(/data:(.*?);base64/);

        if (!data || !mimeMatch) return null;

        return {
            inlineData: {
                mimeType: mimeMatch[1],
                data
            }
        };
    }

    function buildParts({ text, image }) {
        const parts = [];
        const imagePart = getImagePart(image);

        if (text) {
            parts.push({ text });
        }

        if (imagePart) {
            parts.push(imagePart);
        }

        if (!parts.length) {
            parts.push({ text: "Hello" });
        }

        return parts;
    }

    function readResponseText(response) {
        if (!response) return "";

        if (typeof response.text === "string") {
            return response.text.trim();
        }

        if (typeof response.text === "function") {
            return String(response.text()).trim();
        }

        if (typeof response.output_text === "string") {
            return response.output_text.trim();
        }

        if (Array.isArray(response.output)) {
            return response.output
                .flatMap(item => item.content || [])
                .map(item => item.text || "")
                .join("")
                .trim();
        }

        const parts = response.candidates?.[0]?.content?.parts || [];
        return parts.map(part => part.text || "").join("").trim();
    }

    async function generateWithInteractions(ai, payload, signal) {
        if (!ai.interactions?.create) return "";

        const interaction = await ai.interactions.create({
            model: MODEL,
            input: payload.text || "Describe this image",
            signal
        });

        return readResponseText(interaction);
    }

    async function generateWithModels(ai, payload) {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: [
                {
                    role: "user",
                    parts: buildParts(payload)
                }
            ]
        });

        return readResponseText(response);
    }

    async function streamText(text, { signal, onToken }) {
        const chunks = text.match(/.{1,3}/gs) || [];

        for (const chunk of chunks) {
            if (signal.aborted) throw new DOMException("Generation stopped", "AbortError");
            onToken(chunk);
            await wait(18);
        }
    }

    async function streamResponse(payload, { signal, onToken }) {
        validateApiKey();

        const { GoogleGenAI } = await loadSdk();
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        let text = "";

        try {
            text = await generateWithInteractions(ai, payload, signal);
        } catch (error) {
            console.warn("interactions.create failed, using models.generateContent", error);
        }

        if (!text) {
            text = await generateWithModels(ai, payload);
        }

        if (!text) {
            throw new Error("Gemini returned an empty response.");
        }

        await streamText(text, { signal, onToken });
        return text;
    }

    return { streamResponse };
})();
