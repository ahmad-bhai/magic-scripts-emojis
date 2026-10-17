// api/emoji.js
export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Emoji parameter "id" is required. Example: /api/emoji?id=⚡' });
    }

    try {
        // Emoji character ko Hex Code (Unicode) mein convert karne ka function
        const codePoints = [];
        for (const codePoint of id) {
            codePoints.push(codePoint.codePointAt(0).toString(16));
        }
        // Variation selector-16 (fe0f) skip kar rahe hain
        const hex = codePoints.filter(cp => cp !== 'fe0f').join('-');

        // GitHub / Apple Emoji Data Source Target URL
        const targetUrl = `https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-64/${hex}.png`;

        // GitHub se Image fetch karna
        const response = await fetch(targetUrl);

        if (!response.ok) {
            return res.status(404).json({ error: 'Emoji image not found' });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // CORS Headers setup - taakay Canvas download blank na ho
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        return res.status(200).send(buffer);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch emoji image', details: error.message });
    }
}
