const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { HttpsProxyAgent } = require('https-proxy-agent');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rotating User Agents (looks like different browsers/devices)
const userAgents = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  
  // Chrome on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  
  // Chrome on Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  
  // Safari on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
  
  // Firefox on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',
  
  // Firefox on Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
  
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
  
  // Mobile - iPhone
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  
  // Mobile - iPad
  'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  
  // Mobile - Android Chrome
  'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  
  // Mobile - Android Firefox
  'Mozilla/5.0 (Android 13; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0',
  'Mozilla/5.0 (Android 12; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
  
  // Opera
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0'
];

// Get random user agent
function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Parse proxy list from environment variable
// Format: PROXY_LIST=http://proxy1:port,http://proxy2:port,http://proxy3:port
function getProxyList() {
  const proxyList = process.env.PROXY_LIST;
  if (!proxyList) return [];
  return proxyList.split(',').map(p => p.trim()).filter(p => p);
}

// Get random proxy
let proxyIndex = 0;
function getNextProxy() {
  const proxies = getProxyList();
  if (proxies.length === 0) return null;
  
  const proxy = proxies[proxyIndex];
  proxyIndex = (proxyIndex + 1) % proxies.length;
  return proxy;
}

// Helper function to extract Instagram data from HTML
function extractInstagramData(html) {
  try {
    // Look for the shared data JSON in the HTML
    const regex = /<script type="application\/ld\+json">({.*?})<\/script>/s;
    const match = html.match(regex);
    
    if (match && match[1]) {
      const jsonData = JSON.parse(match[1]);
      return jsonData;
    }

    // Alternative method: Look for window._sharedData
    const sharedDataRegex = /window\._sharedData\s*=\s*({.+?});<\/script>/s;
    const sharedDataMatch = html.match(sharedDataRegex);
    
    if (sharedDataMatch && sharedDataMatch[1]) {
      const sharedData = JSON.parse(sharedDataMatch[1]);
      return sharedData;
    }

    return null;
  } catch (error) {
    console.error('Error extracting Instagram data:', error);
    return null;
  }
}

// API endpoint to get Instagram profile info
app.get('/api/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ 
        error: 'Username is required' 
      });
    }

    // Prepare request config
    const config = {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    };

    // Add proxy if configured
    const proxy = getNextProxy();
    if (proxy) {
      config.httpsAgent = new HttpsProxyAgent(proxy);
      config.proxy = false; // Disable axios default proxy handling
    }

    // Fetch Instagram profile page
    const response = await axios.get(`https://www.instagram.com/${username}/`, config);
    const html = response.data;
    
    // Extract structured data
    const structuredData = extractInstagramData(html);
    
    if (structuredData) {
      // Parse the structured data (JSON-LD format)
      const profileData = {
        username: username,
        name: structuredData.name || null,
        bio: structuredData.description || null,
        profilePicUrl: structuredData.image || null,
        isVerified: structuredData.isVerified || false,
        url: structuredData.url || `https://www.instagram.com/${username}/`,
      };

      // Try to extract follower/following counts from HTML
      const followersMatch = html.match(/"edge_followed_by":\s*{\s*"count":\s*(\d+)\s*}/);
      const followingMatch = html.match(/"edge_follow":\s*{\s*"count":\s*(\d+)\s*}/);
      const postsMatch = html.match(/"edge_owner_to_timeline_media":\s*{\s*"count":\s*(\d+)\s*}/);

      if (followersMatch) profileData.followers = parseInt(followersMatch[1]);
      if (followingMatch) profileData.following = parseInt(followingMatch[1]);
      if (postsMatch) profileData.posts = parseInt(postsMatch[1]);

      return res.json({
        success: true,
        data: profileData
      });
    }

    // Fallback: Basic parsing from HTML meta tags
    const nameMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

    const basicData = {
      username: username,
      name: nameMatch ? nameMatch[1].split('(')[0].trim() : null,
      bio: descMatch ? descMatch[1].split(' - ')[0] : null,
      profilePicUrl: imageMatch ? imageMatch[1] : null,
      url: `https://www.instagram.com/${username}/`
    };

    // Extract stats from description
    if (descMatch) {
      const desc = descMatch[1];
      const followersMatch = desc.match(/(\d+(?:,\d+)*)\s*Followers/);
      const followingMatch = desc.match(/(\d+(?:,\d+)*)\s*Following/);
      const postsMatch = desc.match(/(\d+(?:,\d+)*)\s*Posts/);

      if (followersMatch) basicData.followers = parseInt(followersMatch[1].replace(/,/g, ''));
      if (followingMatch) basicData.following = parseInt(followingMatch[1].replace(/,/g, ''));
      if (postsMatch) basicData.posts = parseInt(postsMatch[1].replace(/,/g, ''));
    }

    return res.json({
      success: true,
      data: basicData
    });

  } catch (error) {
    console.error('Error fetching Instagram data:', error.message);
    
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    if (error.response && error.response.status === 429) {
      return res.status(429).json({ 
        success: false,
        error: 'Instagram rate limit reached. Try again later or configure proxies.' 
      });
    }

    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch Instagram data',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  const proxies = getProxyList();
  res.json({ 
    status: 'OK',
    message: 'Instagram Info API - Real-time with Anti-Ban Protection',
    config: {
      proxiesConfigured: proxies.length,
      userAgents: userAgents.length
    },
    endpoints: {
      getUserInfo: '/api/user/:username'
    },
    example: '/api/user/instagram'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Proxies configured: ${getProxyList().length}`);
  console.log(`User agents available: ${userAgents.length}`);
  console.log(`Try: http://localhost:${PORT}/api/user/instagram`);
});

module.exports = app;
