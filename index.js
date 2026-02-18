const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const userAgents = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

app.get('/api/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ 
        success: false,
        error: 'Username is required' 
      });
    }

    const userAgent = getRandomUserAgent();
    
    // Method 1: Try the web_profile_info API (most reliable)
    try {
      const apiResponse = await axios.get(
        `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
        {
          headers: {
            'User-Agent': userAgent,
            'x-ig-app-id': '936619743392459',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.instagram.com/',
            'X-Requested-With': 'XMLHttpRequest',
          }
        }
      );

      const userData = apiResponse.data?.data?.user;
      
      if (userData) {
        return res.json({
          success: true,
          data: {
            username: userData.username,
            name: userData.full_name || null,
            bio: userData.biography || null,
            profilePicUrl: userData.profile_pic_url_hd || userData.profile_pic_url || null,
            isVerified: userData.is_verified || false,
            url: `https://www.instagram.com/${username}/`,
            followers: userData.edge_followed_by?.count || null,
            following: userData.edge_follow?.count || null,
            posts: userData.edge_owner_to_timeline_media?.count || null,
            isPrivate: userData.is_private || false
          }
        });
      }
    } catch (apiError) {
      console.log('API method failed, trying fallback...');
    }

    // Method 2: Try with __a=1 parameter
    try {
      const fallbackResponse = await axios.get(
        `https://www.instagram.com/${username}/?__a=1&__d=dis`,
        {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.instagram.com/',
            'X-Requested-With': 'XMLHttpRequest',
          }
        }
      );

      const userData = fallbackResponse.data?.graphql?.user || fallbackResponse.data?.user;
      
      if (userData) {
        return res.json({
          success: true,
          data: {
            username: userData.username,
            name: userData.full_name || null,
            bio: userData.biography || null,
            profilePicUrl: userData.profile_pic_url_hd || userData.profile_pic_url || null,
            isVerified: userData.is_verified || false,
            url: `https://www.instagram.com/${username}/`,
            followers: userData.edge_followed_by?.count || null,
            following: userData.edge_follow?.count || null,
            posts: userData.edge_owner_to_timeline_media?.count || null,
            isPrivate: userData.is_private || false
          }
        });
      }
    } catch (fallbackError) {
      console.log('Fallback method failed, trying HTML scraping...');
    }

    // Method 3: Scrape HTML (last resort)
    const htmlResponse = await axios.get(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.instagram.com/',
      }
    });

    const html = htmlResponse.data;
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
    };

    // Extract from meta tags
    const nameMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

    if (nameMatch) {
      profileData.name = nameMatch[1].replace(/\s*\([^)]*\)\s*on Instagram.*$/i, '').trim();
    }

    if (descMatch) {
      const desc = descMatch[1];
      
      // Extract followers, following, posts
      const followersMatch = desc.match(/([\d,\.]+[KMB]?)\s*Followers/i);
      const followingMatch = desc.match(/([\d,\.]+[KMB]?)\s*Following/i);
      const postsMatch = desc.match(/([\d,\.]+[KMB]?)\s*Posts/i);

      if (followersMatch) profileData.followers = parseNumber(followersMatch[1]);
      if (followingMatch) profileData.following = parseNumber(followingMatch[1]);
      if (postsMatch) profileData.posts = parseNumber(postsMatch[1]);

      // Extract bio (everything before the stats)
      const bioText = desc.split(/\d+\s*(Followers|Following|Posts)/i)[0].trim();
      if (bioText && bioText !== profileData.name) {
        profileData.bio = bioText.replace(/^["']|["']$/g, '');
      }
    }

    if (imageMatch) {
      profileData.profilePicUrl = imageMatch[1];
    }

    return res.json({
      success: true,
      data: profileData,
      note: 'Limited data - Instagram may be blocking full access'
    });

  } catch (error) {
    console.error('Error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({ 
        success: false,
        error: 'Rate limit reached' 
      });
    }

    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch data',
      message: error.message
    });
  }
});

function parseNumber(str) {
  if (!str) return null;
  str = str.toString().trim().toUpperCase().replace(/,/g, '');
  
  if (str.includes('K')) return Math.round(parseFloat(str) * 1000);
  if (str.includes('M')) return Math.round(parseFloat(str) * 1000000);
  if (str.includes('B')) return Math.round(parseFloat(str) * 1000000000);
  
  return parseInt(str) || null;
}

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Instagram Info API',
    endpoints: {
      getUserInfo: '/api/user/:username'
    },
    example: '/api/user/cristiano'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
