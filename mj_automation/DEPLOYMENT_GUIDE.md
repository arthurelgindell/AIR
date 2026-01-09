# Midjourney Web Automation - Deployment Guide

Complete guide to deploy the working MJ automation solution to a new macOS system.

---

## Prerequisites

- **macOS** (tested on macOS 15.x / Darwin 25.x)
- **Google Chrome** installed
- **Python 3.9+** (comes with macOS)
- **Active Midjourney subscription** (Pro recommended - $60/mo)
- **Network access** to BETA storage server (via Tailscale)

---

## Step 1: Create Directory Structure

```bash
mkdir -p ~/ARTHUR/mj_automation
cd ~/ARTHUR/mj_automation
```

---

## Step 2: Install the Automation Module

Create `mj_web_automation.py`:

```python
#!/usr/bin/env python3
"""
Midjourney Web Automation Module

Automates image generation via midjourney.com web interface using Chrome.
Requires user to be logged into midjourney.com in Chrome.
"""

import subprocess
import json
import time
import os
from typing import Optional, Dict, List, Any
from dataclasses import dataclass


@dataclass
class GenerationResult:
    """Result of a Midjourney generation"""
    success: bool
    job_id: Optional[str]
    image_urls: List[str]
    prompt: str
    elapsed_seconds: float
    error: Optional[str] = None


class MidjourneyAutomation:
    """Automates Midjourney via web interface"""

    def __init__(self, poll_interval: int = 5, max_wait: int = 180):
        self.poll_interval = poll_interval
        self.max_wait = max_wait
        self.base_url = "https://www.midjourney.com"

    def _run_applescript(self, script: str) -> str:
        """Execute AppleScript and return result"""
        cmd = f"""osascript << 'EOF'
{script}
EOF"""
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout.strip()

    def _run_js_in_chrome(self, js_code: str) -> str:
        """Execute JavaScript in Chrome's active tab"""
        js_escaped = js_code.replace('\\', '\\\\').replace('"', '\\"').replace('\n', ' ')
        script = f'''
tell application "Google Chrome"
    tell active tab of front window
        execute javascript "{js_escaped}"
    end tell
end tell
'''
        return self._run_applescript(script)

    def _navigate_to_imagine(self) -> bool:
        """Navigate Chrome to MJ imagine page"""
        script = '''
tell application "Google Chrome"
    activate
    set URL of active tab of front window to "https://www.midjourney.com/imagine"
end tell
delay 3
tell application "Google Chrome"
    tell active tab of front window
        execute javascript "window.location.href.includes('imagine')"
    end tell
end tell
'''
        result = self._run_applescript(script)
        return 'true' in result.lower()

    def _check_logged_in(self) -> bool:
        """Check if user is logged into Midjourney"""
        js = "(function() { return document.body.innerText.includes('My Account'); })();"
        result = self._run_js_in_chrome(js)
        return 'true' in result.lower()

    def _enter_prompt(self, prompt: str) -> bool:
        """Enter prompt into textarea"""
        js = f'''
(function() {{
    const textarea = document.querySelector('textarea');
    if (!textarea) return JSON.stringify({{success: false, error: 'No textarea'}});
    textarea.focus();
    textarea.value = '';
    textarea.value = {json.dumps(prompt)};
    textarea.dispatchEvent(new Event('input', {{ bubbles: true }}));
    textarea.dispatchEvent(new Event('change', {{ bubbles: true }}));
    return JSON.stringify({{success: true, value: textarea.value}});
}})();
'''
        result = self._run_js_in_chrome(js)
        try:
            data = json.loads(result)
            return data.get('success', False)
        except:
            return False

    def _submit_prompt(self) -> bool:
        """Submit the prompt by pressing Enter"""
        script = '''
tell application "Google Chrome"
    activate
end tell
delay 0.2
tell application "System Events"
    keystroke return
end tell
delay 1
'''
        self._run_applescript(script)
        return True

    def _get_generation_status(self) -> Dict[str, Any]:
        """Check generation status and get image URLs if complete"""
        js = '''
(function() {
    const text = document.body.innerText;
    const progressMatch = text.match(/(\\d+)% Complete/);
    const progress = progressMatch ? parseInt(progressMatch[1]) : null;
    const images = document.querySelectorAll('img[src*="cdn.midjourney"]');
    const imageUrls = [];
    for (const img of images) {
        if (img.src && img.naturalWidth > 50) {
            imageUrls.push(img.src);
        }
    }
    const urlMatch = window.location.href.match(/jobs\\/([a-f0-9-]+)/);
    const jobId = urlMatch ? urlMatch[1] : null;
    const hasError = text.toLowerCase().includes('error') && text.toLowerCase().includes('generation');
    return JSON.stringify({
        progress: progress,
        imageCount: imageUrls.length,
        imageUrls: [...new Set(imageUrls)],
        jobId: jobId,
        hasError: hasError,
        isGenerating: text.includes('Generating') || progress !== null
    });
})();
'''
        result = self._run_js_in_chrome(js)
        try:
            return json.loads(result)
        except:
            return {'progress': None, 'imageCount': 0, 'imageUrls': [], 'hasError': False, 'isGenerating': False}

    def _poll_for_completion(self) -> Dict[str, Any]:
        """Poll until generation completes or times out"""
        start_time = time.time()
        last_progress = None

        while time.time() - start_time < self.max_wait:
            status = self._get_generation_status()
            progress = status.get('progress')
            image_count = status.get('imageCount', 0)

            if progress and progress != last_progress:
                print(f"  Progress: {progress}%")
                last_progress = progress

            if image_count >= 4 and not status.get('isGenerating'):
                return {
                    'success': True,
                    'image_urls': status.get('imageUrls', []),
                    'job_id': status.get('jobId')
                }

            if status.get('hasError'):
                return {'success': False, 'error': 'Generation error detected'}

            time.sleep(self.poll_interval)

        final_status = self._get_generation_status()
        if final_status.get('imageCount', 0) > 0:
            return {
                'success': True,
                'image_urls': final_status.get('imageUrls', []),
                'job_id': final_status.get('jobId')
            }

        return {'success': False, 'error': 'Timeout waiting for generation'}

    def generate(self, prompt: str, navigate: bool = True) -> GenerationResult:
        """Generate images from a prompt."""
        start_time = time.time()

        if navigate:
            print("Navigating to Midjourney...")
            if not self._navigate_to_imagine():
                return GenerationResult(
                    success=False, job_id=None, image_urls=[], prompt=prompt,
                    elapsed_seconds=time.time() - start_time,
                    error="Failed to navigate to imagine page"
                )

        if not self._check_logged_in():
            return GenerationResult(
                success=False, job_id=None, image_urls=[], prompt=prompt,
                elapsed_seconds=time.time() - start_time,
                error="Not logged into Midjourney"
            )

        print(f"Entering prompt: {prompt[:50]}...")
        if not self._enter_prompt(prompt):
            return GenerationResult(
                success=False, job_id=None, image_urls=[], prompt=prompt,
                elapsed_seconds=time.time() - start_time,
                error="Failed to enter prompt"
            )

        print("Submitting prompt...")
        self._submit_prompt()
        time.sleep(3)

        print("Waiting for generation...")
        result = self._poll_for_completion()
        elapsed = time.time() - start_time

        if result.get('success'):
            print(f"Generation complete! ({elapsed:.1f}s)")
            return GenerationResult(
                success=True,
                job_id=result.get('job_id'),
                image_urls=result.get('image_urls', []),
                prompt=prompt,
                elapsed_seconds=elapsed
            )
        else:
            print(f"Generation failed: {result.get('error')}")
            return GenerationResult(
                success=False, job_id=None, image_urls=[], prompt=prompt,
                elapsed_seconds=elapsed, error=result.get('error')
            )

    def download_images(self, image_urls: List[str], output_dir: str, prefix: str = "mj") -> List[str]:
        """Download images to local directory."""
        os.makedirs(output_dir, exist_ok=True)
        downloaded = []

        for i, url in enumerate(image_urls):
            ext = '.webp' if 'webp' in url else '.png'
            filename = f"{prefix}_{i}{ext}"
            filepath = os.path.join(output_dir, filename)
            subprocess.run(f'curl -s -o "{filepath}" "{url}"', shell=True)
            if os.path.exists(filepath):
                downloaded.append(filepath)
                print(f"  Downloaded: {filename}")

        return downloaded

    def transfer_to_remote(self, local_files: List[str], remote_host: str, remote_path: str) -> bool:
        """Transfer files to remote storage via rsync."""
        subprocess.run(f'ssh {remote_host} "mkdir -p {remote_path}"', shell=True)

        for filepath in local_files:
            cmd = f'rsync -avz "{filepath}" "{remote_host}:{remote_path}/"'
            result = subprocess.run(cmd, shell=True, capture_output=True)
            if result.returncode != 0:
                print(f"  Failed to transfer: {filepath}")
                return False
            print(f"  Transferred: {os.path.basename(filepath)}")

        return True


if __name__ == "__main__":
    mj = MidjourneyAutomation()
    result = mj.generate("test automation cosmic scene --ar 16:9 --v 6.1")

    if result.success:
        print(f"\nSuccess! Images: {len(result.image_urls)}")
        files = mj.download_images(result.image_urls, "/tmp/mj_test", "test")
        print(f"Downloaded {len(files)} files")
    else:
        print(f"\nFailed: {result.error}")
```

---

## Step 3: Configure SSH Access to BETA Storage

### 3.1 Create SSH Key

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

Create `~/.ssh/sphere_access` with this private key:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBKr8+Q9EnKFk4drw1x/gF7pMzH5A8kLkvhT7W/x6d1WwAAAJiD8MUOg/DF
DgAAAAtzc2gtZWQyNTUxOQAAACBKr8+Q9EnKFk4drw1x/gF7pMzH5A8kLkvhT7W/x6d1Ww
AAAECe1x8Hq7xkG5K9vR8kL3nF4T6mJ2wY8dH1q5R7vL8pO0qvz5D0ScoWTh2vDXH+AXuk
zMfkDyQuS+FPtb/Hp3VbAAAAE3NwaGVyZV9hY2Nlc3Nfa2V5XzEBAg==
-----END OPENSSH PRIVATE KEY-----
```

Set permissions:

```bash
chmod 600 ~/.ssh/sphere_access
```

### 3.2 Configure SSH Config

Add to `~/.ssh/config`:

```
Host beta
    HostName 100.84.202.68
    User arthurdell
    IdentityFile ~/.ssh/sphere_access
    IdentitiesOnly yes
```

### 3.3 Test Connection

```bash
ssh beta "ls /Volumes/STUDIO"
```

Should show: `IMAGES  VIDEO`

---

## Step 4: Enable Chrome AppleScript/JavaScript

**One-time setup in Chrome:**

1. Open Chrome
2. Menu: **View → Developer → Allow JavaScript from Apple Events**
3. Check the option to enable it

---

## Step 5: Log into Midjourney

1. Open Chrome
2. Navigate to https://www.midjourney.com
3. Log in with your Midjourney account
4. Verify you see "My Account" in the sidebar
5. **Keep Chrome open** - the automation uses the existing session

**Midjourney Account:**
- Email: arthur.dell@dellight.ai
- Subscription: Pro ($60/mo)

---

## Step 6: Test the Automation

```bash
cd ~/ARTHUR/mj_automation

python3 -c "
from mj_web_automation import MidjourneyAutomation

mj = MidjourneyAutomation()

# Quick test - check if logged in
print('Navigating...')
mj._navigate_to_imagine()

import time
time.sleep(2)

logged_in = mj._check_logged_in()
print(f'Logged into Midjourney: {logged_in}')
"
```

---

## Step 7: Run a Full Test Generation

```bash
python3 -c "
from mj_web_automation import MidjourneyAutomation

mj = MidjourneyAutomation()

# Generate test image
result = mj.generate('cosmic nebula test --ar 16:9 --v 6.1')

if result.success:
    print(f'Success! {len(result.image_urls)} images')

    # Download
    files = mj.download_images(result.image_urls, '/tmp/mj_deploy_test', 'test')

    # Transfer to BETA
    mj.transfer_to_remote(files, 'beta', '/Volumes/STUDIO/IMAGES/2026/deploy_test')

    print('Files transferred to BETA!')
else:
    print(f'Failed: {result.error}')
"
```

---

## Usage Examples

### Single Generation

```python
from mj_web_automation import MidjourneyAutomation

mj = MidjourneyAutomation()
result = mj.generate("your prompt here --ar 16:9 --v 6.1")

if result.success:
    files = mj.download_images(result.image_urls, "/tmp/output", "myimage")
    mj.transfer_to_remote(files, "beta", "/Volumes/STUDIO/IMAGES/2026/myproject")
```

### Batch Generation

```python
from mj_web_automation import MidjourneyAutomation

prompts = [
    "cosmic dawn, ethereal light --ar 16:9 --v 6.1",
    "ocean depths, bioluminescence --ar 16:9 --v 6.1",
    "forest spirits, magical fog --ar 16:9 --v 6.1"
]

mj = MidjourneyAutomation()

for i, prompt in enumerate(prompts):
    print(f"\n[{i+1}/{len(prompts)}] {prompt[:40]}...")
    result = mj.generate(prompt, navigate=(i == 0))

    if result.success:
        files = mj.download_images(result.image_urls, f"/tmp/batch/prompt_{i}", f"img_{i}")
        mj.transfer_to_remote(files, "beta", f"/Volumes/STUDIO/IMAGES/2026/batch/prompt_{i}")
```

---

## Troubleshooting

### "Not logged into Midjourney"

1. Open Chrome manually
2. Go to https://www.midjourney.com
3. Log in if needed
4. Verify "My Account" appears

### "Failed to navigate to imagine page"

1. Ensure Chrome is open
2. Check internet connection
3. Try manually loading https://www.midjourney.com/imagine

### SSH connection fails

1. Ensure Tailscale is running: `tailscale status`
2. Test direct connection: `ssh beta "echo ok"`
3. Check BETA is online

### Low resolution images (Draft Mode)

Toggle Draft Mode off in the MJ web interface before running automation.

---

## Storage Paths on BETA

```
/Volumes/STUDIO/
├── IMAGES/
│   └── 2026/
│       └── [your_batches]/
└── VIDEO/
    └── 2026/
        └── [your_batches]/
```

---

## Key Points

1. **Chrome must be open** with an active MJ session
2. **Session persists for weeks** - no need to re-login frequently
3. **No Discord required** - web interface only
4. **Uses your existing subscription** - no API costs
5. **AppleScript controls Chrome** - macOS only

## Important Limitation

**Chrome must remain on the MJ page during generation.**

- Do NOT navigate Chrome away while batch is running
- Do NOT use Chrome for other tasks during generation
- Best run as an **attended process** or on a dedicated machine
- Each generation takes ~30-90 seconds

For unattended batch runs, dedicate Chrome to MJ automation only.

---

## Files Summary

| File | Purpose |
|------|---------|
| `~/ARTHUR/mj_automation/mj_web_automation.py` | Core automation module |
| `~/.ssh/sphere_access` | SSH private key for BETA |
| `~/.ssh/config` | SSH host configuration |

---

*Last tested: 2026-01-06 on macOS Darwin 25.2.0*
