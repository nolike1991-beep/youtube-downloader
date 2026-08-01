module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight handle
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ 
            success: false, 
            message: 'YouTube URL required' 
        });
    }

    // Video ID extract karein
    const videoId = extractVideoId(url);
    
    if (!videoId) {
        return res.status(400).json({
            success: false,
            message: 'Valid YouTube URL daalein'
        });
    }

    try {
        // RapidAPI call
        const response = await fetch(`https://youtube-media-downloader.p.rapidapi.com/v2/video/download?videoId=${videoId}`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': 'e1ecca733bmshca01ab32d5fab4cp10ce02jsn9bcad32ed2e1',
                'X-RapidAPI-Host': 'youtube-media-downloader.p.rapidapi.com'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API error');
        }

        // Response format karein
        const formats = [];
        
        // Agar different qualities hain toh unko format karein
        if (data.links && Array.isArray(data.links)) {
            data.links.forEach(link => {
                formats.push({
                    quality: link.quality || 'HD',
                    url: link.url || link.link,
                    size: link.size || ''
                });
            });
        } else if (data.url) {
            formats.push({
                quality: data.quality || 'HD',
                url: data.url,
                size: data.size || ''
            });
        }

        res.status(200).json({
            success: true,
            title: data.title || 'YouTube Video',
            thumbnail: data.thumbnail || `https://img.youtube.com/vi/${videoId}/0.jpg`,
            duration: data.duration || '',
            formats: formats
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Download failed: ' + error.message
        });
    }
};

// YouTube Video ID extractor
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
        /youtube\.com\/shorts\/([^&\s?]+)/,
        /youtube\.com\/live\/([^&\s?]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1] && match[1].length === 11) {
            return match[1];
        }
    }
    
    // Fallback - general regex
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};
