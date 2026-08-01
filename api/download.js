const ytdl = require('@distube/ytdl-core');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight request handle karein
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Sirf POST allow karein
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            message: 'Method not allowed' 
        });
    }

    const { url } = req.body;

    // URL check
    if (!url) {
        return res.status(400).json({ 
            success: false, 
            message: 'YouTube URL required hai' 
        });
    }

    // Valid YouTube URL check
    if (!ytdl.validateURL(url)) {
        return res.status(400).json({
            success: false,
            message: 'Valid YouTube URL daalein'
        });
    }

    try {
        // Video info fetch karein
        const info = await ytdl.getInfo(url);
        
        // Video + Audio dono wale formats filter karein
        const formats = info.formats
            .filter(f => f.hasVideo && f.hasAudio)
            .map(f => ({
                quality: f.qualityLabel || 'Audio',
                url: f.url,
                container: f.container
            }))
            .slice(0, 5); // Sirf top 5 formats

        // Success response
        res.status(200).json({
            success: true,
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
            duration: info.videoDetails.lengthSeconds,
            formats: formats
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Video fetch failed: ' + error.message
        });
    }
};
