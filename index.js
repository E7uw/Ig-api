const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const userAgents = [
  'Instagram 76.0.0.15.395 Android (24/7.0; 640dpi; 1440x2560; samsung; SM-G930F; herolte; samsungexynos8890; en_US; 138226743)',
  'Instagram 10.26.0 (iPhone7,2; iOS 10_1_1; en_US; en-US; scale=2.00; gamut=normal; 750x1334)',
  'Instagram 10.26.0 Android (18/4.3; 320dpi; 720x1280; Xiaomi; HM 1SW; armani; qcom; en_US)',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 12_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 105.0.0.11.118 (iPhone11,8; iOS 12_3_1; en_US; en-US; scale=2.00; 828x1792; 165586599)',
  'Mozilla/5.0 (Linux; Android 9; SM-G960F Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.157 Mobile Safari/537.36 Instagram 105.0.0.11.118 Android (28/9; 480dpi; 1080x2076; samsung; SM-G960F; starlte; samsungexynos9810; en_US; 164094539)'
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

    // Use the same endpoint as your friend's PHP API
    const response = await axios.get(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'X-IG-App-ID': '936619743392459',
          'X-ASBD-ID': '129477',
          'X-IG-WWW-Claim': '0',
          'Origin': 'https://www.instagram.com',
          'Referer': 'https://www.instagram.com/',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
        },
        timeout: 10000
      }
    );

    const userData = response.data?.data?.user;
    
    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found or data unavailable'
      });
    }

    return res.json({
      success: true,
      data: {
        id: userData.id || null,
        username: userData.username,
        name: userData.full_name || null,
        bio: userData.biography || null,
        profilePicUrl: userData.profile_pic_url_hd || userData.profile_pic_url || null,
        isVerified: userData.is_verified || false,
        isPrivate: userData.is_private || false,
        isBusiness: userData.is_business_account || false,
        url: `https://www.instagram.com/${username}/`,
        externalUrl: userData.external_url || null,
        followers: userData.edge_followed_by?.count || null,
        following: userData.edge_follow?.count || null,
        posts: userData.edge_owner_to_timeline_media?.count || null,
        category: userData.category_name || null
      }
    });

  } catch (error) {
    console.error('Error:', error.response?.status, error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    if (error.response?.status === 429) {
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

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Instagram Info API',
    endpoints: {
      getUserInfo: '/api/user/:username'
    },
    example: '/api/user/f1'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
