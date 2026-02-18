const express = require('express');
const axios = require('axios');
const cors = require('cors');

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

// API endpoint to get Instagram profile info
app.get('/api/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ 
        success: false,
        error: 'Username is required' 
      });
    }

    // Prepare request config
    const config = {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'TE': 'trailers'
      }
    };

    // Fetch Instagram profile page
    const response = await axios.get(`https://www.instagram.com/${username}/`, config);
    const html = response.data;
    
    // Initialize profile data
    const profileData = {
      username: username,
      name: null,
      bio: null,
      profilePicUrl: null,
      isVerified: false,
      url: `https://www.instagram.com/${username}/`,
      followers: null,
      following: null,
      posts: null
      dev @YuichiOlds
    };

    // Method 1: Try to extract from script tags with JSON data
    const scriptRegex = /<script type="application\/ld\+json">(.+?)<\/script>/gs;
    const scriptMatches = html.matchAll(scriptRegex);
    
    for (const match of scriptMatches) {
      try {
        const jsonData = JSON.parse(match[1]);
        if (jsonData['@type'] === 'ProfilePage' || jsonData.name) {
          profileData.name = jsonData.name || profileData.name;
          profileData.bio = jsonData.description || profileData.bio;
          profileData.profilePicUrl = jsonData.image || profileData.profilePicUrl;
          if (jsonData.interactionStatistic) {
            jsonData.interactionStatistic.forEach(stat => {
              if (stat.interactionType === 'http://schema.org/FollowAction') {
                profileData.followers = parseInt(stat.userInteractionCount);
              }
            });
          }
        }
      } catch (e) {
        // Continue to next script tag
      }
    }

    // Method 2: Extract from meta tags
    const nameMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

    if (nameMatch && !profileData.name) {
      profileData.name = nameMatch[1].split('(')[0].trim();
    }
    
    if (descMatch && !profileData.bio) {
      const desc = descMatch[1];
      
      // Extract stats from description
      const followersMatch = desc.match(/([\d,\.]+[KMB]?)\s*Followers/i);
      const followingMatch = desc.match(/([\d,\.]+[KMB]?)\s*Following/i);
      const postsMatch = desc.match(/([\d,\.]+[KMB]?)\s*Posts/i);

      if (followersMatch) {
        profileData.followers = parseInstagramNumber(followersMatch[1]);
      }
      if (followingMatch) {
        profileData.following = parseInstagramNumber(followingMatch[1]);
      }
      if (postsMatch) {
        profileData.posts = parseInstagramNumber(postsMatch[1]);
      }

      // Extract bio (text before stats)
      const bioMatch = desc.split(/\d+\s*(Followers|Following|Posts)/)[0].trim();
      if (bioMatch) {
        profileData.bio = bioMatch;
      }
    }

    if (imageMatch && !profileData.profilePicUrl) {
      profileData.profilePicUrl = imageMatch[1];
    }

    // Method 3: Extract from inline JSON (most reliable for counts)
    const followersJsonMatch = html.match(/"edge_followed_by":\s*{\s*"count":\s*(\d+)\s*}/);
    const followingJsonMatch = html.match(/"edge_follow":\s*{\s*"count":\s*(\d+)\s*}/);
    const postsJsonMatch = html.match(/"edge_owner_to_timeline_media":\s*{\s*"count":\s*(\d+)\s*}/);
    const verifiedMatch = html.match(/"is_verified":\s*(true|false)/);
    const fullNameMatch = html.match(/"full_name":\s*"([^"]+)"/);
    const biographyMatch = html.match(/"biography":\s*"([^"]+)"/);
    const profilePicMatch = html.match(/"profile_pic_url_hd":\s*"([^"]+)"/);

    if (followersJsonMatch) {
      profileData.followers = parseInt(followersJsonMatch[1]);
    }
    if (followingJsonMatch) {
      profileData.following = parseInt(followingJsonMatch[1]);
    }
    if (postsJsonMatch) {
      profileData.posts = parseInt(postsJsonMatch[1]);
    }
    if (verifiedMatch) {
      profileData.isVerified = verifiedMatch[1] === 'true';
    }
    if (fullNameMatch) {
      profileData.name = fullNameMatch[1];
    }
    if (biographyMatch) {
      profileData.bio = biographyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
    if (profilePicMatch) {
      profileData.profilePicUrl = profilePicMatch[1].replace(/\\u0026/g, '&');
    }

    return res.json({
      success: true,
      data: profileData
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
        error: 'Rate limit reached. Try again later.' 
      });
    }

    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch Instagram data',
      message: error.message
    });
  }
});

// Helper function to parse Instagram numbers (1.2M, 500K, etc.)
function parseInstagramNumber(str) {
  if (!str) return null;
  
  str = str.toString().trim().toUpperCase();
  
  // Remove commas
  str = str.replace(/,/g, '');
  
  // Handle K (thousands)
  if (str.includes('K')) {
    return Math.round(parseFloat(str.replace('K', '')) * 1000);
  }
  
  // Handle M (millions)
  if (str.includes('M')) {
    return Math.round(parseFloat(str.replace('M', '')) * 1000000);
  }
  
  // Handle B (billions)
  if (str.includes('B')) {
    return Math.round(parseFloat(str.replace('B', '')) * 1000000000);
  }
  
  // Regular number
  return parseInt(str);
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Instagram Info API - Real-time with Anti-Ban Protection',
    config: {
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
  console.log(`User agents available: ${userAgents.length}`);
  console.log(`Try: http://localhost:${PORT}/api/user/instagram`);
});

module.exports = app;
