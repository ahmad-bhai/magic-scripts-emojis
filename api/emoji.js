// api/emoji.js
export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Emoji parameter "id" is required. Example: /api/emoji?id=❤️‍🔥' });
    }

    try {
        // Emoji character ko Apple/iamcal Unicode Hex Sequence mein badalne ka correct formula
        const getEmojiHex = (str) => {
            const codePoints = [];
            for (const char of str) {
                codePoints.push(char.codePointAt(0).toString(16));
            }

            // Agar emoji ZWJ (200d) container hai (jaise ❤️‍🔥 ya ❤️‍🩹) to bilkul exact sequence chalega
            // Lekin agar normal standalone emoji ho to fe0f clean rakhte hain
            let hex = codePoints.join('-');

            // Handling single standalone variation selectors
            if (!hex.includes('200d')) {
                hex = codePoints.filter(cp => cp !== 'fe0f').join('-');
            }
            return hex;
        };

        const hex = getEmojiHex(id);

        // GitHub Primary & CDN Fallback URLs
        const primaryUrl = `https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-64/${hex}.png`;

        let response = await fetch(primaryUrl);

        // Agar variation mismatch ki wajah se 404 aaye (jaise single heart ❤️) to fe0f ke sath retry karein
        if (!response.ok && !hex.includes('fe0f')) {
            const fallbackHex = Array.from(id).map(c => c.codePointAt(0).toString(16)).join('-');
            const fallbackUrl = `https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-64/${fallbackHex}.png`;
            response = await fetch(fallbackUrl);
        }

        if (!response.ok) {
            return res.status(404).json({ error: `Emoji image not found for code: ${hex}` });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // CORS Headers & Caching Setup
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        return res.status(200).send(buffer);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch emoji image', details: error.message });
    }
}
