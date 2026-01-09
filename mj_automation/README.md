# Midjourney Web Automation

Reliable automation for Midjourney via the web interface (midjourney.com) - no Discord required.

## Why This Works

- **No Discord security issues** - Uses web interface with stable cookie-based session
- **Uses your existing subscription** - No additional API costs
- **Reliable authentication** - Session persists for weeks
- **Full automation** - Prompt → Generate → Download → Transfer

## Requirements

- macOS with Google Chrome
- Logged into midjourney.com in Chrome
- Python 3.9+
- SSH access to BETA storage (already configured)

## Files

| File | Description |
|------|-------------|
| `mj_web_automation.py` | Core automation module (images + video) |
| `batch_workflow.py` | Batch processing for themed generations |
| `sample_themes.json` | Example themes configuration |
| `linkedin_themes.json` | Professional LinkedIn content themes (12 themes) |
| `DEPLOYMENT_GUIDE.md` | Full deployment instructions |
| `credentials.md` | SSH keys and credentials |

## Quick Start

### 1. Ensure you're logged into Midjourney

Open Chrome and navigate to https://www.midjourney.com/imagine - make sure you see "My Account" in the menu.

### 2. Single Generation

```python
from mj_web_automation import MidjourneyAutomation

mj = MidjourneyAutomation()
result = mj.generate("cosmic nebula, ethereal light --ar 16:9 --v 6.1")

if result.success:
    print(f"Generated {len(result.image_urls)} images")

    # Download locally
    files = mj.download_images(result.image_urls, "/tmp/mj_output", "cosmic")

    # Transfer to BETA
    mj.transfer_to_remote(files, "beta", "/Volumes/STUDIO/IMAGES/2026/test")
```

### 3. Video Generation

Generate videos from prompts (image-to-video workflow):

```python
from mj_web_automation import MidjourneyAutomation

mj = MidjourneyAutomation()

# Generate video (creates image first, then animates)
result = mj.generate_video(
    prompt="confident business leader in modern office --ar 16:9 --v 6.1",
    motion_mode="low",  # 'low' for ambient, 'high' for dynamic
    image_index=0       # Which of the 4 generated images to animate
)

if result.success:
    print(f"Video generated! Duration: ~5 seconds")
    print(f"Job ID: {result.job_id}")
    print(f"Video URL: {result.video_url}")
    print(f"Source image: {result.source_image_url}")
```

**Video Parameters:**
- `motion_mode`: 'low' (ambient, subtle) or 'high' (dynamic, camera movement)
- `image_index`: 0-3, which generated image to animate

**Note:** Video downloads require browser authentication. Use the browser to download videos manually, or the video URL for viewing.

### 4. Batch Generation

Create a themes file (e.g., `my_themes.json`):

```json
{
  "batch_id": "january_batch",
  "themes": [
    {
      "id": "cosmic_dawn",
      "image_prompts": [
        "ethereal sunrise over alien landscape --ar 16:9 --v 6.1",
        "cosmic nebula with bioluminescent flora --ar 16:9 --v 6.1"
      ],
      "video_prompt": "slow pan across cosmic dawn landscape --ar 16:9 --v 6.1",
      "motion_mode": "low"
    },
    {
      "id": "ocean_depths",
      "image_prompts": [
        "deep ocean bioluminescence, ancient ruins --ar 16:9 --v 6.1"
      ],
      "video_prompt": "underwater camera drift through bioluminescent scene --ar 16:9 --v 6.1",
      "motion_mode": "high"
    }
  ],
  "output": {
    "remote_host": "beta",
    "images_path": "/Volumes/STUDIO/IMAGES",
    "video_path": "/Volumes/STUDIO/VIDEO"
  }
}
```

Run the batch:

```bash
python3 batch_workflow.py my_themes.json
```

## Output Structure

Generated files are saved to BETA storage:

```
/Volumes/STUDIO/IMAGES/
└── 2026/
    └── january_batch/
        ├── manifest.json
        ├── cosmic_dawn/
        │   ├── cosmic_dawn_img_0_0.webp
        │   ├── cosmic_dawn_img_0_1.webp
        │   └── ...
        └── ocean_depths/
            └── ...
```

## Configuration

### MidjourneyAutomation Options

```python
mj = MidjourneyAutomation(
    poll_interval=5,   # Seconds between status checks
    max_wait=180       # Max seconds to wait for generation
)
```

### Prompt Parameters

Include Midjourney parameters in your prompts:

- `--ar 16:9` - Aspect ratio
- `--v 6.1` - Model version
- `--style raw` - Style mode
- `--chaos 50` - Variation amount
- `--stylize 200` - Stylization strength

## Troubleshooting

### "Not logged into Midjourney"

1. Open Chrome
2. Go to https://www.midjourney.com
3. Log in with your account
4. Verify "My Account" appears in the sidebar

### Draft Mode (low resolution)

If images are low resolution, Draft Mode may be enabled. Toggle it off in the MJ web interface before running automation.

### Generation timeout

Increase `max_wait` parameter for complex prompts:

```python
mj = MidjourneyAutomation(max_wait=300)  # 5 minutes
```

## Comparison to Discord Approach

| Feature | Discord | Web Interface |
|---------|---------|---------------|
| Phone verification | Required | Not required |
| Token expiration | Frequent | Rare (weeks) |
| Security flags | Common | Rare |
| Setup complexity | High | Low |
| Reliability | Low | High |

## Integration with Sim Studio

This automation can be integrated into Sim Studio as a custom tool. The module is self-contained and can be imported directly.
