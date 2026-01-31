# Minimax Video Status - Endpoint Not Found

## 🔍 Current Situation

The video **creation** works perfectly, but the **status checking** endpoint hasn't been identified yet.

### ✅ What Works
- Creating video tasks: `POST https://api.minimax.io/v1/video_generation`
- Getting task IDs back immediately
- Videos are being processed on Minimax servers

### ❌ What's Missing
- Status check endpoint (to get video URL when ready)
- Cannot retrieve completed videos via API yet

## 🛠️ Solutions

### 1. Run Endpoint Discovery
Try to find the correct endpoint automatically:

```bash
node discover-status-endpoint.js 361720188367060
```

This will test dozens of possible endpoint patterns.

### 2. Check Minimax Dashboard
Your videos may be visible in your Minimax account dashboard:
- Go to https://platform.minimax.chat or https://minimax.io
- Log in with your API key account
- Look for "Video Generation" or "Generated Videos" section

### 3. Contact Minimax Support
- Email: support@minimax.chat
- Ask for: "Video generation status API endpoint documentation"
- Mention: You can create videos but need to retrieve them

### 4. Check Documentation
Look for official docs at:
- https://platform.minimax.chat/document/api
- https://api.minimax.io/docs
- Any documentation that came with your API key

## 📋 Your Generated Videos

These task IDs are waiting to be retrieved:

| Task ID | Description | Created |
|---------|-------------|---------|
| 361720188367060 | Sunrise scene | ~30 min ago |
| 361722345226624 | Pythagorean theorem | ~30 min ago |
| 361719676203292 | Photosynthesis | ~30 min ago |
| 361719033217270 | DNA helix | ~30 min ago |

## 🔧 Tested Endpoints (All Failed)

We've already tried:
- `GET/POST /v1/query/video_generation`
- `GET/POST /v1/video_generation/query`
- `GET/POST /v1/video_generation/{task_id}`
- `GET/POST /v1/video_generation/status`
- Various combinations on both `api.minimax.io` and `api.minimax.chat`

## 💡 Likely Solutions

### Option A: Different API Structure
Minimax might use a completely different approach:
- Webhook notifications instead of polling
- Dashboard-only access (no API retrieval)
- Different authentication for status checks

### Option B: Documentation Missing
The status endpoint exists but isn't documented:
- May need special headers
- May use different authentication
- May require group_id or other parameters

### Option C: Beta Feature
Video generation might be in beta:
- Status checking not yet available via API
- Only accessible through dashboard
- Requires special access or permissions

## 🚀 Next Steps

1. **Immediate**: Run `node discover-status-endpoint.js` to try all patterns
2. **Check Dashboard**: Log into Minimax platform to see videos
3. **Contact Support**: Ask for status endpoint documentation
4. **Wait**: Videos might appear in dashboard even without API access

## 📞 Need Help?

If you find the correct endpoint or get information from Minimax:
1. Update [src/services/minimaxVideo.ts](src/services/minimaxVideo.ts)
2. Update [download-video.js](download-video.js)
3. Share the endpoint pattern for others!

---

**Status**: Videos are being generated but retrieval method unknown
**Impact**: Can create videos but cannot download them programmatically yet
**Workaround**: Check Minimax dashboard manually
