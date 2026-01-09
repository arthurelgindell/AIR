#!/usr/bin/env python3
"""
Midjourney Web Automation Module

Automates image generation via midjourney.com web interface using Chrome.
Requires user to be logged into midjourney.com in Chrome.

Usage:
    from mj_web_automation import MidjourneyAutomation

    mj = MidjourneyAutomation()
    result = mj.generate("cosmic nebula --ar 16:9 --v 6.1")
    print(result['image_urls'])
"""

import subprocess
import json
import time
import os
import re
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from pathlib import Path


@dataclass
class GenerationResult:
    """Result of a Midjourney generation"""
    success: bool
    job_id: Optional[str]
    image_urls: List[str]
    prompt: str
    elapsed_seconds: float
    error: Optional[str] = None


@dataclass
class VideoGenerationResult:
    """Result of a Midjourney video generation"""
    success: bool
    job_id: Optional[str]
    video_url: Optional[str]
    source_image_url: Optional[str]
    prompt: str
    motion_mode: str  # 'high' or 'low'
    elapsed_seconds: float
    error: Optional[str] = None


class MidjourneyAutomation:
    """Automates Midjourney via web interface"""

    def __init__(self, poll_interval: int = 5, max_wait: int = 180):
        """
        Initialize MJ automation.

        Args:
            poll_interval: Seconds between status checks
            max_wait: Maximum seconds to wait for generation
        """
        self.poll_interval = poll_interval
        self.max_wait = max_wait
        self.base_url = "https://www.midjourney.com"

    def _run_applescript(self, script: str) -> str:
        """Execute AppleScript and return result"""
        cmd = f'''osascript << 'EOF'
{script}
EOF'''
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout.strip()

    def _run_js_in_chrome(self, js_code: str) -> str:
        """Execute JavaScript in Chrome's active tab"""
        import tempfile

        # Write JS to temp file to avoid escaping issues
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(js_code)
            js_file = f.name

        try:
            # Read the file content in AppleScript and execute
            script = f'''
set jsCode to read POSIX file "{js_file}" as «class utf8»
tell application "Google Chrome"
    tell active tab of front window
        execute javascript jsCode
    end tell
end tell
'''
            result = self._run_applescript(script)
        finally:
            os.remove(js_file)

        return result

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
        js = '''
(function() {
    return document.body.innerText.includes('My Account');
})();
'''
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

    // Check for completed images
    const images = document.querySelectorAll('img[src*="cdn.midjourney"]');
    const imageUrls = [];
    for (const img of images) {
        if (img.src && img.naturalWidth > 50) {
            imageUrls.push(img.src);
        }
    }

    // Get job ID from URL if available
    const urlMatch = window.location.href.match(/jobs\\/([a-f0-9-]+)/);
    const jobId = urlMatch ? urlMatch[1] : null;

    // Check for errors
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

            # Log progress
            if progress and progress != last_progress:
                print(f"  Progress: {progress}%")
                last_progress = progress

            # Check for completion (has images and not actively generating)
            if image_count >= 4 and not status.get('isGenerating'):
                return {
                    'success': True,
                    'image_urls': status.get('imageUrls', []),
                    'job_id': status.get('jobId')
                }

            # Check for error
            if status.get('hasError'):
                return {
                    'success': False,
                    'error': 'Generation error detected'
                }

            time.sleep(self.poll_interval)

        # Timeout - check if we have any images
        final_status = self._get_generation_status()
        if final_status.get('imageCount', 0) > 0:
            return {
                'success': True,
                'image_urls': final_status.get('imageUrls', []),
                'job_id': final_status.get('jobId')
            }

        return {
            'success': False,
            'error': 'Timeout waiting for generation'
        }

    def generate(self, prompt: str, navigate: bool = True) -> GenerationResult:
        """
        Generate images from a prompt.

        Args:
            prompt: The full MJ prompt including parameters
            navigate: Whether to navigate to imagine page first

        Returns:
            GenerationResult with success status and image URLs
        """
        start_time = time.time()

        # Navigate to imagine page if requested
        if navigate:
            print("Navigating to Midjourney...")
            if not self._navigate_to_imagine():
                return GenerationResult(
                    success=False,
                    job_id=None,
                    image_urls=[],
                    prompt=prompt,
                    elapsed_seconds=time.time() - start_time,
                    error="Failed to navigate to imagine page"
                )

        # Check login status
        if not self._check_logged_in():
            return GenerationResult(
                success=False,
                job_id=None,
                image_urls=[],
                prompt=prompt,
                elapsed_seconds=time.time() - start_time,
                error="Not logged into Midjourney"
            )

        # Enter prompt
        print(f"Entering prompt: {prompt[:50]}...")
        if not self._enter_prompt(prompt):
            return GenerationResult(
                success=False,
                job_id=None,
                image_urls=[],
                prompt=prompt,
                elapsed_seconds=time.time() - start_time,
                error="Failed to enter prompt"
            )

        # Submit
        print("Submitting prompt...")
        self._submit_prompt()

        # Wait a moment for generation to start
        time.sleep(3)

        # Poll for completion
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
                success=False,
                job_id=None,
                image_urls=[],
                prompt=prompt,
                elapsed_seconds=elapsed,
                error=result.get('error')
            )

    def download_images(self, image_urls: List[str], output_dir: str, prefix: str = "mj") -> List[str]:
        """
        Download images to local directory.

        Args:
            image_urls: List of image URLs to download
            output_dir: Directory to save images
            prefix: Filename prefix

        Returns:
            List of local file paths
        """
        os.makedirs(output_dir, exist_ok=True)
        downloaded = []

        for i, url in enumerate(image_urls):
            ext = '.webp' if 'webp' in url else '.png'
            filename = f"{prefix}_{i}{ext}"
            filepath = os.path.join(output_dir, filename)

            cmd = f'curl -s -o "{filepath}" "{url}"'
            subprocess.run(cmd, shell=True)

            if os.path.exists(filepath):
                downloaded.append(filepath)
                print(f"  Downloaded: {filename}")

        return downloaded

    def transfer_to_remote(self, local_files: List[str], remote_host: str, remote_path: str) -> bool:
        """
        Transfer files to remote storage via rsync.

        Args:
            local_files: List of local file paths
            remote_host: SSH host (e.g., 'beta')
            remote_path: Remote directory path

        Returns:
            True if successful
        """
        # Create remote directory
        subprocess.run(f'ssh {remote_host} "mkdir -p {remote_path}"', shell=True)

        # Transfer each file
        for filepath in local_files:
            cmd = f'rsync -avz "{filepath}" "{remote_host}:{remote_path}/"'
            result = subprocess.run(cmd, shell=True, capture_output=True)
            if result.returncode != 0:
                print(f"  Failed to transfer: {filepath}")
                return False
            print(f"  Transferred: {os.path.basename(filepath)}")

        return True

    # ========== VIDEO GENERATION METHODS ==========

    def _navigate_to_image_detail(self, image_index: int = 0) -> bool:
        """
        Click on a generated image to open its detail view.

        Args:
            image_index: Index of image to click (0-3 for typical 4-image grid)
        """
        js = f'''
(function() {{
    // Find all MJ images in the generation area
    const images = document.querySelectorAll('img[src*="cdn.midjourney"]');
    const clickableImages = [];

    for (const img of images) {{
        if (img.naturalWidth > 50) {{
            clickableImages.push(img);
        }}
    }}

    if (clickableImages.length === 0) {{
        return JSON.stringify({{success: false, error: 'No images found'}});
    }}

    const targetIndex = Math.min({image_index}, clickableImages.length - 1);
    const targetImg = clickableImages[targetIndex];

    // Click on the image
    targetImg.click();

    return JSON.stringify({{success: true, clicked: targetIndex, total: clickableImages.length}});
}})();
'''
        result = self._run_js_in_chrome(js)
        try:
            data = json.loads(result)
            return data.get('success', False)
        except:
            return False

    def _find_and_click_animate(self) -> bool:
        """Find and click the Animate button in the image detail view"""
        # Wait for detail view to load
        time.sleep(1.5)

        js = '''
(function() {
    // Look for Animate button - it may be text or icon-based
    const buttons = document.querySelectorAll('button');

    for (const btn of buttons) {
        const text = btn.innerText.toLowerCase();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();

        if (text.includes('animate') || ariaLabel.includes('animate') ||
            text.includes('video') || ariaLabel.includes('video')) {
            btn.click();
            return JSON.stringify({success: true, buttonText: btn.innerText});
        }
    }

    // Also check for elements with animate in class or data attributes
    const animateElements = document.querySelectorAll('[class*="animate"], [data-action*="animate"]');
    for (const el of animateElements) {
        if (el.tagName === 'BUTTON' || el.onclick) {
            el.click();
            return JSON.stringify({success: true, elementType: 'class-based'});
        }
    }

    return JSON.stringify({success: false, error: 'Animate button not found'});
})();
'''
        result = self._run_js_in_chrome(js)
        try:
            data = json.loads(result)
            return data.get('success', False)
        except:
            return False

    def _set_motion_mode(self, mode: str = 'high') -> bool:
        """
        Set motion mode for video generation.

        Args:
            mode: 'high' or 'low'
        """
        js = f'''
(function() {{
    const modeText = '{mode}'.toLowerCase();
    const buttons = document.querySelectorAll('button');

    for (const btn of buttons) {{
        const text = btn.innerText.toLowerCase();
        if (text.includes(modeText + ' motion') || text === modeText) {{
            btn.click();
            return JSON.stringify({{success: true, mode: modeText}});
        }}
    }}

    // Try radio buttons or toggle elements
    const inputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    for (const input of inputs) {{
        const label = input.closest('label') || document.querySelector('label[for="' + input.id + '"]');
        if (label && label.innerText.toLowerCase().includes(modeText)) {{
            input.click();
            return JSON.stringify({{success: true, mode: modeText, type: 'input'}});
        }}
    }}

    return JSON.stringify({{success: false, error: 'Motion mode selector not found'}});
}})();
'''
        result = self._run_js_in_chrome(js)
        try:
            data = json.loads(result)
            return data.get('success', False)
        except:
            return False

    def _submit_video_generation(self) -> bool:
        """Submit the video generation request"""
        js = '''
(function() {
    // Look for submit/generate/create button in video modal
    const buttons = document.querySelectorAll('button');

    for (const btn of buttons) {
        const text = btn.innerText.toLowerCase();
        if (text.includes('generate') || text.includes('create') ||
            text.includes('animate') || text.includes('submit')) {
            // Make sure it's not disabled
            if (!btn.disabled) {
                btn.click();
                return JSON.stringify({success: true, buttonText: btn.innerText});
            }
        }
    }

    return JSON.stringify({success: false, error: 'Submit button not found or disabled'});
})();
'''
        result = self._run_js_in_chrome(js)
        try:
            data = json.loads(result)
            return data.get('success', False)
        except:
            return False

    def _get_video_status(self) -> Dict[str, Any]:
        """Check video generation status and get video URL if complete"""
        js = '''
(function() {
    const text = document.body.innerText;

    // Check for progress indicator
    const progressMatch = text.match(/(\\d+)%/);
    const progress = progressMatch ? parseInt(progressMatch[1]) : null;

    // Look for video elements
    const videos = document.querySelectorAll('video');
    let videoUrl = null;

    for (const video of videos) {
        const src = video.src || video.querySelector('source')?.src;
        if (src && src.includes('midjourney')) {
            videoUrl = src;
            break;
        }
    }

    // Check for CDN video URLs in page HTML
    if (!videoUrl) {
        const html = document.documentElement.innerHTML;
        const cdnMatch = html.match(/https:\\/\\/cdn\\.midjourney\\.com\\/video\\/[^"'\\s]+\\.mp4/);
        if (cdnMatch) videoUrl = cdnMatch[0];
    }

    // Check for Vimeo iframe (video is hosted there)
    let vimeoUrl = null;
    const vimeoIframe = document.querySelector('iframe[src*="vimeo"]');
    if (vimeoIframe) {
        vimeoUrl = vimeoIframe.src;
    }

    // Get job ID from URL
    const urlMatch = window.location.href.match(/jobs\\/([a-f0-9-]+)/);
    const jobId = urlMatch ? urlMatch[1] : null;

    // Check for errors
    const hasError = text.toLowerCase().includes('error') || text.toLowerCase().includes('failed');

    // Check if still generating
    const isGenerating = text.includes('Generating') || text.includes('Processing') ||
                         text.includes('Animating') || (progress !== null && progress < 100);

    // Check for duration indicator (video complete)
    const durationMatch = text.match(/duration\\s*([\\d.]+)s/i);
    const duration = durationMatch ? parseFloat(durationMatch[1]) : null;

    // Video is ready if we have a vimeo iframe or CDN URL
    const hasVideo = (vimeoUrl !== null) || (videoUrl !== null) || (duration !== null);

    return JSON.stringify({
        progress: progress,
        videoUrl: videoUrl,
        vimeoUrl: vimeoUrl,
        jobId: jobId,
        hasError: hasError,
        isGenerating: isGenerating,
        hasVideo: hasVideo,
        duration: duration
    });
})();
'''
        result = self._run_js_in_chrome(js)
        try:
            return json.loads(result)
        except:
            return {'progress': None, 'videoUrl': None, 'hasError': False, 'isGenerating': False, 'hasVideo': False}

    def _poll_for_video_completion(self, max_wait: int = 300) -> Dict[str, Any]:
        """
        Poll until video generation completes or times out.
        Video takes longer than images (~2-3 minutes)
        """
        start_time = time.time()
        last_progress = None

        while time.time() - start_time < max_wait:
            status = self._get_video_status()

            progress = status.get('progress')

            # Log progress
            if progress and progress != last_progress:
                print(f"  Video progress: {progress}%")
                last_progress = progress

            # Check for completion
            if status.get('hasVideo') and not status.get('isGenerating'):
                return {
                    'success': True,
                    'video_url': status.get('videoUrl'),
                    'job_id': status.get('jobId')
                }

            # Check for error
            if status.get('hasError'):
                return {
                    'success': False,
                    'error': 'Video generation error detected'
                }

            time.sleep(self.poll_interval)

        # Timeout - check final status
        final_status = self._get_video_status()
        if final_status.get('hasVideo'):
            return {
                'success': True,
                'video_url': final_status.get('videoUrl'),
                'job_id': final_status.get('jobId')
            }

        return {
            'success': False,
            'error': 'Timeout waiting for video generation'
        }

    def generate_video(self, prompt: str, motion_mode: str = 'high',
                       image_index: int = 0, navigate: bool = True) -> VideoGenerationResult:
        """
        Generate a video from a prompt (image-to-video workflow).

        This first generates an image, then animates it into a 5-second video.

        Args:
            prompt: The image prompt (video will be generated from resulting image)
            motion_mode: 'high' or 'low' motion
            image_index: Which image from the grid to animate (0-3)
            navigate: Whether to navigate to imagine page first

        Returns:
            VideoGenerationResult with success status and video URL
        """
        start_time = time.time()

        # Step 1: Generate the source image first
        print("Step 1: Generating source image...")
        image_result = self.generate(prompt, navigate=navigate)

        if not image_result.success:
            return VideoGenerationResult(
                success=False,
                job_id=None,
                video_url=None,
                source_image_url=None,
                prompt=prompt,
                motion_mode=motion_mode,
                elapsed_seconds=time.time() - start_time,
                error=f"Failed to generate source image: {image_result.error}"
            )

        source_image_url = image_result.image_urls[image_index] if image_result.image_urls else None
        print(f"  Source image generated. Selecting image {image_index + 1}...")

        # Step 2: Click on the image to open detail view
        print("Step 2: Opening image detail view...")
        time.sleep(2)  # Wait for images to fully load

        if not self._navigate_to_image_detail(image_index):
            return VideoGenerationResult(
                success=False,
                job_id=image_result.job_id,
                video_url=None,
                source_image_url=source_image_url,
                prompt=prompt,
                motion_mode=motion_mode,
                elapsed_seconds=time.time() - start_time,
                error="Failed to open image detail view"
            )

        time.sleep(2)  # Wait for detail view to load

        # Step 3: Find and click Animate button
        print("Step 3: Clicking Animate button...")
        if not self._find_and_click_animate():
            return VideoGenerationResult(
                success=False,
                job_id=image_result.job_id,
                video_url=None,
                source_image_url=source_image_url,
                prompt=prompt,
                motion_mode=motion_mode,
                elapsed_seconds=time.time() - start_time,
                error="Failed to find Animate button"
            )

        time.sleep(1.5)  # Wait for animate modal

        # Step 4: Set motion mode
        print(f"Step 4: Setting motion mode to '{motion_mode}'...")
        self._set_motion_mode(motion_mode)
        time.sleep(0.5)

        # Step 5: Submit video generation
        print("Step 5: Submitting video generation...")
        if not self._submit_video_generation():
            # Try pressing Enter as fallback
            self._submit_prompt()

        time.sleep(3)  # Wait for generation to start

        # Step 6: Poll for completion (videos take longer)
        print("Step 6: Waiting for video generation (this may take 2-3 minutes)...")
        result = self._poll_for_video_completion(max_wait=300)

        elapsed = time.time() - start_time

        if result.get('success'):
            print(f"Video generation complete! ({elapsed:.1f}s)")
            return VideoGenerationResult(
                success=True,
                job_id=result.get('job_id'),
                video_url=result.get('video_url'),
                source_image_url=source_image_url,
                prompt=prompt,
                motion_mode=motion_mode,
                elapsed_seconds=elapsed
            )
        else:
            print(f"Video generation failed: {result.get('error')}")
            return VideoGenerationResult(
                success=False,
                job_id=None,
                video_url=None,
                source_image_url=source_image_url,
                prompt=prompt,
                motion_mode=motion_mode,
                elapsed_seconds=elapsed,
                error=result.get('error')
            )

    def download_video(self, video_url: str, output_dir: str, filename: str = "video") -> Optional[str]:
        """
        Download video to local directory via browser fetch (handles Cloudflare).

        Args:
            video_url: URL of the video to download
            output_dir: Directory to save video
            filename: Base filename (without extension)

        Returns:
            Local file path if successful, None otherwise
        """
        os.makedirs(output_dir, exist_ok=True)

        ext = '.mp4'
        if '.webm' in video_url:
            ext = '.webm'
        elif '.gif' in video_url:
            ext = '.gif'

        filepath = os.path.join(output_dir, f"{filename}{ext}")

        # Use browser-based download via fetch (handles Cloudflare auth)
        js = f'''
(async function() {{
    try {{
        const response = await fetch("{video_url}", {{credentials: 'include', mode: 'cors'}});
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {{
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
        }});
        return JSON.stringify({{success: true, data: base64, size: blob.size}});
    }} catch(e) {{
        return JSON.stringify({{success: false, error: e.message}});
    }}
}})();
'''
        result = self._run_js_in_chrome(js)

        try:
            data = json.loads(result)
            if data.get('success') and data.get('data'):
                import base64
                video_bytes = base64.b64decode(data['data'])
                with open(filepath, 'wb') as f:
                    f.write(video_bytes)
                print(f"  Downloaded video: {filename}{ext} ({len(video_bytes)} bytes)")
                return filepath
            else:
                print(f"  Browser fetch failed: {data.get('error', 'Unknown error')}")
        except Exception as e:
            print(f"  Download error: {e}")

        # Fallback: try direct curl with cookies
        cookies = self._run_js_in_chrome("document.cookie")
        if cookies:
            cmd = f'curl -s -L -o "{filepath}" -H "Cookie: {cookies}" -H "Referer: https://www.midjourney.com/" "{video_url}"'
            subprocess.run(cmd, shell=True)
            if os.path.exists(filepath) and os.path.getsize(filepath) > 10000:
                print(f"  Downloaded video via curl: {filename}{ext}")
                return filepath

        print(f"  Failed to download video")
        return None

    def _get_video_urls_from_page(self) -> List[str]:
        """Extract all video URLs from the current page"""
        js = '''
(function() {
    const urls = [];
    // Check video elements
    const videos = document.querySelectorAll('video');
    for (const v of videos) {
        if (v.src && v.src.includes('midjourney')) urls.push(v.src);
        if (v.currentSrc && v.currentSrc.includes('midjourney')) urls.push(v.currentSrc);
    }
    // Check page source for CDN video URLs
    const matches = document.documentElement.innerHTML.match(/https:\\/\\/cdn\\.midjourney\\.com\\/video\\/[^"'\\s]+\\.mp4/g) || [];
    urls.push(...matches);
    return JSON.stringify([...new Set(urls)]);
})();
'''
        result = self._run_js_in_chrome(js)
        try:
            return json.loads(result)
        except:
            return []

    def generate_video_from_image_url(self, image_url: str, motion_mode: str = 'high') -> VideoGenerationResult:
        """
        Generate video from an existing image URL (upload and animate).

        Args:
            image_url: URL of image to animate
            motion_mode: 'high' or 'low' motion

        Returns:
            VideoGenerationResult
        """
        start_time = time.time()

        # Navigate to imagine page with image input mode
        print("Navigating to Midjourney with image upload...")
        script = '''
tell application "Google Chrome"
    activate
    set URL of active tab of front window to "https://www.midjourney.com/imagine"
end tell
delay 3
'''
        self._run_applescript(script)

        # This would require more complex handling for image upload
        # For now, return not implemented
        return VideoGenerationResult(
            success=False,
            job_id=None,
            video_url=None,
            source_image_url=image_url,
            prompt="",
            motion_mode=motion_mode,
            elapsed_seconds=time.time() - start_time,
            error="Image URL upload not yet implemented - use generate_video() with a prompt instead"
        )


def batch_generate(prompts: List[Dict[str, str]],
                   output_base: str = "/tmp/mj_batch",
                   remote_host: Optional[str] = None,
                   remote_path: Optional[str] = None) -> List[Dict]:
    """
    Generate multiple prompts in batch.

    Args:
        prompts: List of dicts with 'id' and 'prompt' keys
        output_base: Base directory for local output
        remote_host: Optional remote host for transfer
        remote_path: Optional remote path for transfer

    Returns:
        List of results for each prompt
    """
    mj = MidjourneyAutomation()
    results = []

    for i, item in enumerate(prompts):
        prompt_id = item.get('id', f'prompt_{i}')
        prompt_text = item.get('prompt', '')

        print(f"\n[{i+1}/{len(prompts)}] Processing: {prompt_id}")

        # Generate
        result = mj.generate(prompt_text, navigate=(i == 0))

        if result.success:
            # Download
            local_dir = os.path.join(output_base, prompt_id)
            local_files = mj.download_images(result.image_urls, local_dir, prompt_id)

            # Transfer if remote specified
            if remote_host and remote_path:
                remote_dir = os.path.join(remote_path, prompt_id)
                mj.transfer_to_remote(local_files, remote_host, remote_dir)

            results.append({
                'id': prompt_id,
                'success': True,
                'image_urls': result.image_urls,
                'local_files': local_files,
                'elapsed': result.elapsed_seconds
            })
        else:
            results.append({
                'id': prompt_id,
                'success': False,
                'error': result.error,
                'elapsed': result.elapsed_seconds
            })

        # Brief pause between generations
        if i < len(prompts) - 1:
            time.sleep(2)

    return results


if __name__ == "__main__":
    import sys

    mj = MidjourneyAutomation()

    # Check for video test flag
    if len(sys.argv) > 1 and sys.argv[1] == '--video':
        # Test video generation
        print("Testing VIDEO generation...")
        prompt = "professional business person in modern office, confident pose, soft lighting --ar 16:9 --v 6.1"

        result = mj.generate_video(prompt, motion_mode='low')

        if result.success:
            print(f"\nVideo Success! Job ID: {result.job_id}")
            print(f"Video URL: {result.video_url}")
            print(f"Source Image: {result.source_image_url}")

            # Download video
            if result.video_url:
                video_file = mj.download_video(result.video_url, "/tmp/mj_video_test", "test_video")
                if video_file:
                    print(f"\nDownloaded video: {video_file}")

                    # Transfer to BETA
                    mj.transfer_to_remote([video_file], "beta", "/Volumes/STUDIO/VIDEO/2026/mj_test")
        else:
            print(f"\nVideo Failed: {result.error}")
    else:
        # Test single image generation (default)
        print("Testing IMAGE generation...")
        result = mj.generate("test automation cosmic scene --ar 16:9 --v 6.1")

        if result.success:
            print(f"\nSuccess! Job ID: {result.job_id}")
            print(f"Images: {len(result.image_urls)}")
            for url in result.image_urls:
                print(f"  {url[:80]}...")

            # Download
            files = mj.download_images(result.image_urls, "/tmp/mj_test", "test")
            print(f"\nDownloaded {len(files)} files")
        else:
            print(f"\nFailed: {result.error}")
