/**
 * Midjourney Web Automation
 *
 * TypeScript port of mj_web_automation.py
 * Automates image/video generation via midjourney.com web interface.
 */

import { runAppleScript, runJsInChrome, runCommand } from "../lib/subprocess";

export interface GenerationResult {
  success: boolean;
  jobId: string | null;
  imageUrls: string[];
  prompt: string;
  elapsedSeconds: number;
  error?: string;
}

export interface VideoGenerationResult {
  success: boolean;
  jobId: string | null;
  videoUrl: string | null;
  sourceImageUrl: string | null;
  prompt: string;
  motionMode: "high" | "low";
  elapsedSeconds: number;
  error?: string;
}

interface GenerationStatus {
  progress: number | null;
  imageCount: number;
  imageUrls: string[];
  jobId: string | null;
  hasError: boolean;
  isGenerating: boolean;
}

interface VideoStatus {
  progress: number | null;
  videoUrl: string | null;
  vimeoUrl: string | null;
  jobId: string | null;
  hasError: boolean;
  isGenerating: boolean;
  hasVideo: boolean;
  duration: number | null;
}

export class MidjourneyAutomation {
  private readonly baseUrl = "https://www.midjourney.com";
  private readonly pollInterval: number;
  private readonly maxWait: number;

  constructor(pollInterval = 5000, maxWait = 180000) {
    this.pollInterval = pollInterval;
    this.maxWait = maxWait;
  }

  /**
   * Navigate Chrome to MJ imagine page
   */
  private async navigateToImagine(): Promise<boolean> {
    const script = `
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
`;
    const result = await runAppleScript(script);
    return result.stdout.toLowerCase().includes("true");
  }

  /**
   * Check if user is logged in
   */
  private async checkLoggedIn(): Promise<boolean> {
    const js = `(function() { return document.body.innerText.includes('My Account'); })();`;
    const result = await runJsInChrome(js);
    return result.toLowerCase().includes("true");
  }

  /**
   * Enter prompt into textarea
   */
  private async enterPrompt(prompt: string): Promise<boolean> {
    const js = `
(function() {
    const textarea = document.querySelector('textarea');
    if (!textarea) return JSON.stringify({success: false, error: 'No textarea'});

    textarea.focus();
    textarea.value = '';
    textarea.value = ${JSON.stringify(prompt)};
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    return JSON.stringify({success: true, value: textarea.value});
})();
`;
    const result = await runJsInChrome(js);
    try {
      const data = JSON.parse(result);
      return data.success ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Submit the prompt by pressing Enter
   */
  private async submitPrompt(): Promise<boolean> {
    const script = `
tell application "Google Chrome"
    activate
end tell
delay 0.2
tell application "System Events"
    keystroke return
end tell
delay 1
`;
    await runAppleScript(script);
    return true;
  }

  /**
   * Get generation status and image URLs
   */
  private async getGenerationStatus(): Promise<GenerationStatus> {
    const js = `
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
`;
    const result = await runJsInChrome(js);
    try {
      return JSON.parse(result);
    } catch {
      return {
        progress: null,
        imageCount: 0,
        imageUrls: [],
        jobId: null,
        hasError: false,
        isGenerating: false,
      };
    }
  }

  /**
   * Poll until generation completes
   */
  private async pollForCompletion(): Promise<{
    success: boolean;
    imageUrls?: string[];
    jobId?: string | null;
    error?: string;
  }> {
    const startTime = Date.now();
    let lastProgress: number | null = null;

    while (Date.now() - startTime < this.maxWait) {
      const status = await this.getGenerationStatus();
      const { progress, imageCount, isGenerating } = status;

      if (progress && progress !== lastProgress) {
        console.log(`  Progress: ${progress}%`);
        lastProgress = progress;
      }

      if (imageCount >= 4 && !isGenerating) {
        return {
          success: true,
          imageUrls: status.imageUrls,
          jobId: status.jobId,
        };
      }

      if (status.hasError) {
        return { success: false, error: "Generation error detected" };
      }

      await Bun.sleep(this.pollInterval);
    }

    // Timeout - check final status
    const finalStatus = await this.getGenerationStatus();
    if (finalStatus.imageCount > 0) {
      return {
        success: true,
        imageUrls: finalStatus.imageUrls,
        jobId: finalStatus.jobId,
      };
    }

    return { success: false, error: "Timeout waiting for generation" };
  }

  /**
   * Generate images from a prompt
   */
  async generate(prompt: string, navigate = true): Promise<GenerationResult> {
    const startTime = Date.now();

    if (navigate) {
      console.log("Navigating to Midjourney...");
      if (!(await this.navigateToImagine())) {
        return {
          success: false,
          jobId: null,
          imageUrls: [],
          prompt,
          elapsedSeconds: (Date.now() - startTime) / 1000,
          error: "Failed to navigate to imagine page",
        };
      }
    }

    if (!(await this.checkLoggedIn())) {
      return {
        success: false,
        jobId: null,
        imageUrls: [],
        prompt,
        elapsedSeconds: (Date.now() - startTime) / 1000,
        error: "Not logged into Midjourney",
      };
    }

    console.log(`Entering prompt: ${prompt.slice(0, 50)}...`);
    if (!(await this.enterPrompt(prompt))) {
      return {
        success: false,
        jobId: null,
        imageUrls: [],
        prompt,
        elapsedSeconds: (Date.now() - startTime) / 1000,
        error: "Failed to enter prompt",
      };
    }

    console.log("Submitting prompt...");
    await this.submitPrompt();
    await Bun.sleep(3000);

    console.log("Waiting for generation...");
    const result = await this.pollForCompletion();
    const elapsed = (Date.now() - startTime) / 1000;

    if (result.success) {
      console.log(`Generation complete! (${elapsed.toFixed(1)}s)`);
      return {
        success: true,
        jobId: result.jobId ?? null,
        imageUrls: result.imageUrls ?? [],
        prompt,
        elapsedSeconds: elapsed,
      };
    } else {
      console.log(`Generation failed: ${result.error}`);
      return {
        success: false,
        jobId: null,
        imageUrls: [],
        prompt,
        elapsedSeconds: elapsed,
        error: result.error,
      };
    }
  }

  /**
   * Download images to local directory
   */
  async downloadImages(
    imageUrls: string[],
    outputDir: string,
    prefix = "mj"
  ): Promise<string[]> {
    await runCommand(["mkdir", "-p", outputDir]);
    const downloaded: string[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i]!;
      const ext = url.includes("webp") ? ".webp" : ".png";
      const filename = `${prefix}_${i}${ext}`;
      const filepath = `${outputDir}/${filename}`;

      await runCommand(["curl", "-s", "-o", filepath, url]);

      const file = Bun.file(filepath);
      if (await file.exists()) {
        downloaded.push(filepath);
        console.log(`  Downloaded: ${filename}`);
      }
    }

    return downloaded;
  }

  /**
   * Transfer files to remote storage
   */
  async transferToRemote(
    localFiles: string[],
    remoteHost: string,
    remotePath: string
  ): Promise<boolean> {
    await runCommand(["ssh", remoteHost, `mkdir -p ${remotePath}`]);

    for (const filepath of localFiles) {
      const result = await runCommand([
        "rsync",
        "-avz",
        filepath,
        `${remoteHost}:${remotePath}/`,
      ]);
      if (!result.success) {
        console.log(`  Failed to transfer: ${filepath}`);
        return false;
      }
      console.log(`  Transferred: ${filepath.split("/").pop()}`);
    }

    return true;
  }

  // ========== VIDEO GENERATION ==========

  /**
   * Click on generated image to open detail view
   */
  private async navigateToImageDetail(imageIndex = 0): Promise<boolean> {
    const js = `
(function() {
    const images = document.querySelectorAll('img[src*="cdn.midjourney"]');
    const clickableImages = [];

    for (const img of images) {
        if (img.naturalWidth > 50) {
            clickableImages.push(img);
        }
    }

    if (clickableImages.length === 0) {
        return JSON.stringify({success: false, error: 'No images found'});
    }

    const targetIndex = Math.min(${imageIndex}, clickableImages.length - 1);
    clickableImages[targetIndex].click();

    return JSON.stringify({success: true, clicked: targetIndex, total: clickableImages.length});
})();
`;
    const result = await runJsInChrome(js);
    try {
      const data = JSON.parse(result);
      return data.success ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Find and click Animate button
   */
  private async findAndClickAnimate(): Promise<boolean> {
    await Bun.sleep(1500);

    const js = `
(function() {
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

    return JSON.stringify({success: false, error: 'Animate button not found'});
})();
`;
    const result = await runJsInChrome(js);
    try {
      const data = JSON.parse(result);
      return data.success ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Set motion mode
   */
  private async setMotionMode(mode: "high" | "low"): Promise<boolean> {
    const js = `
(function() {
    const modeText = '${mode}'.toLowerCase();
    const buttons = document.querySelectorAll('button');

    for (const btn of buttons) {
        const text = btn.innerText.toLowerCase();
        if (text.includes(modeText + ' motion') || text === modeText) {
            btn.click();
            return JSON.stringify({success: true, mode: modeText});
        }
    }

    return JSON.stringify({success: false, error: 'Motion mode selector not found'});
})();
`;
    const result = await runJsInChrome(js);
    try {
      const data = JSON.parse(result);
      return data.success ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Submit video generation
   */
  private async submitVideoGeneration(): Promise<boolean> {
    const js = `
(function() {
    const buttons = document.querySelectorAll('button');

    for (const btn of buttons) {
        const text = btn.innerText.toLowerCase();
        if ((text.includes('generate') || text.includes('create') ||
            text.includes('animate') || text.includes('submit')) && !btn.disabled) {
            btn.click();
            return JSON.stringify({success: true, buttonText: btn.innerText});
        }
    }

    return JSON.stringify({success: false, error: 'Submit button not found or disabled'});
})();
`;
    const result = await runJsInChrome(js);
    try {
      const data = JSON.parse(result);
      return data.success ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Get video generation status
   */
  private async getVideoStatus(): Promise<VideoStatus> {
    const js = `
(function() {
    const text = document.body.innerText;
    const progressMatch = text.match(/(\\d+)%/);
    const progress = progressMatch ? parseInt(progressMatch[1]) : null;

    const videos = document.querySelectorAll('video');
    let videoUrl = null;
    for (const video of videos) {
        const src = video.src || video.querySelector('source')?.src;
        if (src && src.includes('midjourney')) {
            videoUrl = src;
            break;
        }
    }

    let vimeoUrl = null;
    const vimeoIframe = document.querySelector('iframe[src*="vimeo"]');
    if (vimeoIframe) vimeoUrl = vimeoIframe.src;

    const urlMatch = window.location.href.match(/jobs\\/([a-f0-9-]+)/);
    const jobId = urlMatch ? urlMatch[1] : null;

    const hasError = text.toLowerCase().includes('error') || text.toLowerCase().includes('failed');
    const isGenerating = text.includes('Generating') || text.includes('Processing') ||
                         text.includes('Animating') || (progress !== null && progress < 100);
    const hasVideo = (vimeoUrl !== null) || (videoUrl !== null);

    return JSON.stringify({
        progress, videoUrl, vimeoUrl, jobId, hasError, isGenerating, hasVideo, duration: null
    });
})();
`;
    const result = await runJsInChrome(js);
    try {
      return JSON.parse(result);
    } catch {
      return {
        progress: null,
        videoUrl: null,
        vimeoUrl: null,
        jobId: null,
        hasError: false,
        isGenerating: false,
        hasVideo: false,
        duration: null,
      };
    }
  }

  /**
   * Poll for video completion
   */
  private async pollForVideoCompletion(maxWait = 300000): Promise<{
    success: boolean;
    videoUrl?: string | null;
    jobId?: string | null;
    error?: string;
  }> {
    const startTime = Date.now();
    let lastProgress: number | null = null;

    while (Date.now() - startTime < maxWait) {
      const status = await this.getVideoStatus();

      if (status.progress && status.progress !== lastProgress) {
        console.log(`  Video progress: ${status.progress}%`);
        lastProgress = status.progress;
      }

      if (status.hasVideo && !status.isGenerating) {
        return { success: true, videoUrl: status.videoUrl, jobId: status.jobId };
      }

      if (status.hasError) {
        return { success: false, error: "Video generation error detected" };
      }

      await Bun.sleep(this.pollInterval);
    }

    const finalStatus = await this.getVideoStatus();
    if (finalStatus.hasVideo) {
      return {
        success: true,
        videoUrl: finalStatus.videoUrl,
        jobId: finalStatus.jobId,
      };
    }

    return { success: false, error: "Timeout waiting for video generation" };
  }

  /**
   * Generate video from prompt
   */
  async generateVideo(
    prompt: string,
    motionMode: "high" | "low" = "high",
    imageIndex = 0,
    navigate = true
  ): Promise<VideoGenerationResult> {
    const startTime = Date.now();

    // Step 1: Generate source image
    console.log("Step 1: Generating source image...");
    const imageResult = await this.generate(prompt, navigate);

    if (!imageResult.success) {
      return {
        success: false,
        jobId: null,
        videoUrl: null,
        sourceImageUrl: null,
        prompt,
        motionMode,
        elapsedSeconds: (Date.now() - startTime) / 1000,
        error: `Failed to generate source image: ${imageResult.error}`,
      };
    }

    const sourceImageUrl = imageResult.imageUrls[imageIndex] ?? null;
    console.log(`  Source image generated. Selecting image ${imageIndex + 1}...`);

    // Step 2: Open detail view
    console.log("Step 2: Opening image detail view...");
    await Bun.sleep(2000);

    if (!(await this.navigateToImageDetail(imageIndex))) {
      return {
        success: false,
        jobId: imageResult.jobId,
        videoUrl: null,
        sourceImageUrl,
        prompt,
        motionMode,
        elapsedSeconds: (Date.now() - startTime) / 1000,
        error: "Failed to open image detail view",
      };
    }

    await Bun.sleep(2000);

    // Step 3: Click Animate
    console.log("Step 3: Clicking Animate button...");
    if (!(await this.findAndClickAnimate())) {
      return {
        success: false,
        jobId: imageResult.jobId,
        videoUrl: null,
        sourceImageUrl,
        prompt,
        motionMode,
        elapsedSeconds: (Date.now() - startTime) / 1000,
        error: "Failed to find Animate button",
      };
    }

    await Bun.sleep(1500);

    // Step 4: Set motion mode
    console.log(`Step 4: Setting motion mode to '${motionMode}'...`);
    await this.setMotionMode(motionMode);
    await Bun.sleep(500);

    // Step 5: Submit
    console.log("Step 5: Submitting video generation...");
    if (!(await this.submitVideoGeneration())) {
      await this.submitPrompt();
    }

    await Bun.sleep(3000);

    // Step 6: Poll
    console.log("Step 6: Waiting for video generation (2-3 minutes)...");
    const result = await this.pollForVideoCompletion(300000);
    const elapsed = (Date.now() - startTime) / 1000;

    if (result.success) {
      console.log(`Video generation complete! (${elapsed.toFixed(1)}s)`);
      return {
        success: true,
        jobId: result.jobId ?? null,
        videoUrl: result.videoUrl ?? null,
        sourceImageUrl,
        prompt,
        motionMode,
        elapsedSeconds: elapsed,
      };
    } else {
      console.log(`Video generation failed: ${result.error}`);
      return {
        success: false,
        jobId: null,
        videoUrl: null,
        sourceImageUrl,
        prompt,
        motionMode,
        elapsedSeconds: elapsed,
        error: result.error,
      };
    }
  }
}

// CLI interface
if (import.meta.main) {
  const mj = new MidjourneyAutomation();
  const args = process.argv.slice(2);

  if (args.includes("--video")) {
    console.log("Testing VIDEO generation...");
    const prompt =
      "professional business person in modern office, confident pose --ar 16:9 --v 6.1";
    const result = await mj.generateVideo(prompt, "low");

    if (result.success) {
      console.log(`\nVideo Success! Job ID: ${result.jobId}`);
      console.log(`Video URL: ${result.videoUrl}`);
      console.log(`Source Image: ${result.sourceImageUrl}`);
    } else {
      console.log(`\nVideo Failed: ${result.error}`);
    }
  } else {
    console.log("Testing IMAGE generation...");
    const result = await mj.generate("test automation cosmic scene --ar 16:9 --v 6.1");

    if (result.success) {
      console.log(`\nSuccess! Job ID: ${result.jobId}`);
      console.log(`Images: ${result.imageUrls.length}`);
      result.imageUrls.forEach((url) => console.log(`  ${url?.slice(0, 80)}...`));

      const files = await mj.downloadImages(result.imageUrls, "/tmp/mj_test", "test");
      console.log(`\nDownloaded ${files.length} files`);
    } else {
      console.log(`\nFailed: ${result.error}`);
    }
  }
}
