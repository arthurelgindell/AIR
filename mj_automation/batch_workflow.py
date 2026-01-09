#!/usr/bin/env python3
"""
Midjourney Batch Workflow

Generates themed images/videos in batch and saves to remote storage.

Usage:
    python3 batch_workflow.py themes.json

Example themes.json:
{
    "batch_id": "batch_001",
    "themes": [
        {
            "id": "cosmic_dawn",
            "image_prompts": [
                "ethereal sunrise over alien landscape, bioluminescent flora --ar 16:9 --v 6.1",
                "cosmic nebula with glowing particles, cinematic lighting --ar 16:9 --v 6.1"
            ],
            "video_prompt": "slow pan across cosmic dawn landscape, ethereal lighting --ar 16:9"
        }
    ],
    "output": {
        "remote_host": "beta",
        "images_path": "/Volumes/STUDIO/IMAGES/2026",
        "video_path": "/Volumes/STUDIO/VIDEO/2026"
    }
}
"""

import json
import sys
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass, asdict

# Import our automation module
from mj_web_automation import MidjourneyAutomation, VideoGenerationResult, batch_generate


@dataclass
class BatchConfig:
    """Configuration for a batch run"""
    batch_id: str
    themes: List[Dict]
    remote_host: str = "beta"
    images_path: str = "/Volumes/STUDIO/IMAGES"
    video_path: str = "/Volumes/STUDIO/VIDEO"


@dataclass
class BatchResult:
    """Result of a batch run"""
    batch_id: str
    started_at: str
    completed_at: str
    total_prompts: int
    successful: int
    failed: int
    results: List[Dict]


def load_themes(filepath: str) -> BatchConfig:
    """Load themes from JSON file"""
    with open(filepath) as f:
        data = json.load(f)

    output = data.get('output', {})
    return BatchConfig(
        batch_id=data.get('batch_id', f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"),
        themes=data.get('themes', []),
        remote_host=output.get('remote_host', 'beta'),
        images_path=output.get('images_path', '/Volumes/STUDIO/IMAGES'),
        video_path=output.get('video_path', '/Volumes/STUDIO/VIDEO')
    )


def run_batch(config: BatchConfig) -> BatchResult:
    """Run a batch of themed generations"""
    mj = MidjourneyAutomation(poll_interval=5, max_wait=180)

    started_at = datetime.now().isoformat()
    results = []
    successful = 0
    failed = 0
    total = 0

    year = datetime.now().strftime('%Y')
    local_base = f"/tmp/mj_{config.batch_id}"

    print(f"\n{'='*60}")
    print(f"MIDJOURNEY BATCH WORKFLOW")
    print(f"Batch ID: {config.batch_id}")
    print(f"Themes: {len(config.themes)}")
    print(f"{'='*60}\n")

    first_generation = True

    for theme_idx, theme in enumerate(config.themes):
        theme_id = theme.get('id', f'theme_{theme_idx}')
        image_prompts = theme.get('image_prompts', [])
        video_prompt = theme.get('video_prompt')

        print(f"\n[Theme {theme_idx + 1}/{len(config.themes)}] {theme_id}")
        print("-" * 40)

        # Process image prompts
        for img_idx, prompt in enumerate(image_prompts):
            total += 1
            prompt_id = f"{theme_id}_img_{img_idx}"
            print(f"\n  Generating image {img_idx + 1}: {prompt[:50]}...")

            result = mj.generate(prompt, navigate=first_generation)
            first_generation = False

            if result.success:
                successful += 1

                # Download locally
                local_dir = os.path.join(local_base, theme_id)
                local_files = mj.download_images(result.image_urls, local_dir, prompt_id)

                # Transfer to remote
                remote_dir = f"{config.images_path}/{year}/{config.batch_id}/{theme_id}"
                mj.transfer_to_remote(local_files, config.remote_host, remote_dir)

                results.append({
                    'id': prompt_id,
                    'type': 'image',
                    'theme': theme_id,
                    'prompt': prompt,
                    'success': True,
                    'image_count': len(result.image_urls),
                    'remote_path': remote_dir,
                    'elapsed': result.elapsed_seconds
                })
                print(f"    ✅ Generated {len(result.image_urls)} images in {result.elapsed_seconds:.1f}s")
            else:
                failed += 1
                results.append({
                    'id': prompt_id,
                    'type': 'image',
                    'theme': theme_id,
                    'prompt': prompt,
                    'success': False,
                    'error': result.error
                })
                print(f"    ❌ Failed: {result.error}")

        # Process video prompt (if any)
        # Uses the new image-to-video workflow
        if video_prompt:
            total += 1
            prompt_id = f"{theme_id}_video"
            motion_mode = theme.get('motion_mode', 'low')
            print(f"\n  Generating video: {video_prompt[:50]}...")
            print(f"    Motion mode: {motion_mode}")

            # Use the new video generation method (generates image first, then animates)
            video_result = mj.generate_video(video_prompt, motion_mode=motion_mode, navigate=False)

            if video_result.success:
                successful += 1

                local_dir = os.path.join(local_base, theme_id)

                # Download video file
                local_files = []
                if video_result.video_url:
                    video_file = mj.download_video(video_result.video_url, local_dir, prompt_id)
                    if video_file:
                        local_files.append(video_file)

                # Also save the source image if available
                if video_result.source_image_url:
                    source_files = mj.download_images([video_result.source_image_url], local_dir, f"{prompt_id}_source")
                    local_files.extend(source_files)

                remote_dir = f"{config.video_path}/{year}/{config.batch_id}/{theme_id}"
                mj.transfer_to_remote(local_files, config.remote_host, remote_dir)

                results.append({
                    'id': prompt_id,
                    'type': 'video',
                    'theme': theme_id,
                    'prompt': video_prompt,
                    'motion_mode': motion_mode,
                    'success': True,
                    'video_url': video_result.video_url,
                    'source_image_url': video_result.source_image_url,
                    'remote_path': remote_dir,
                    'elapsed': video_result.elapsed_seconds
                })
                print(f"    ✅ Generated video in {video_result.elapsed_seconds:.1f}s")
            else:
                failed += 1
                results.append({
                    'id': prompt_id,
                    'type': 'video',
                    'theme': theme_id,
                    'prompt': video_prompt,
                    'motion_mode': motion_mode,
                    'success': False,
                    'error': video_result.error
                })
                print(f"    ❌ Failed: {video_result.error}")

    completed_at = datetime.now().isoformat()

    return BatchResult(
        batch_id=config.batch_id,
        started_at=started_at,
        completed_at=completed_at,
        total_prompts=total,
        successful=successful,
        failed=failed,
        results=results
    )


def save_manifest(result: BatchResult, config: BatchConfig):
    """Save batch manifest to remote storage"""
    manifest = asdict(result)

    # Save locally first
    local_manifest = f"/tmp/mj_{config.batch_id}/manifest.json"
    os.makedirs(os.path.dirname(local_manifest), exist_ok=True)

    with open(local_manifest, 'w') as f:
        json.dump(manifest, f, indent=2)

    # Transfer to remote
    import subprocess
    year = datetime.now().strftime('%Y')
    remote_manifest_dir = f"{config.images_path}/{year}/{config.batch_id}"

    subprocess.run(f'ssh {config.remote_host} "mkdir -p {remote_manifest_dir}"', shell=True)
    subprocess.run(f'rsync -avz "{local_manifest}" "{config.remote_host}:{remote_manifest_dir}/"', shell=True)

    print(f"\nManifest saved to: {config.remote_host}:{remote_manifest_dir}/manifest.json")


def create_sample_themes():
    """Create a sample themes file for testing"""
    sample = {
        "batch_id": "cosmic_themes_001",
        "themes": [
            {
                "id": "cosmic_dawn",
                "image_prompts": [
                    "ethereal sunrise over alien landscape, bioluminescent flora, cinematic --ar 16:9 --v 6.1",
                    "cosmic nebula with glowing particles, volumetric lighting --ar 16:9 --v 6.1"
                ]
            },
            {
                "id": "ocean_depths",
                "image_prompts": [
                    "deep ocean bioluminescence, ancient underwater ruins --ar 16:9 --v 6.1",
                    "ethereal jellyfish swarm, neon glow, dark waters --ar 16:9 --v 6.1"
                ]
            },
            {
                "id": "forest_spirits",
                "image_prompts": [
                    "enchanted forest at twilight, magical fireflies --ar 16:9 --v 6.1",
                    "ancient tree spirit awakening, mystical fog --ar 16:9 --v 6.1"
                ]
            }
        ],
        "output": {
            "remote_host": "beta",
            "images_path": "/Volumes/STUDIO/IMAGES",
            "video_path": "/Volumes/STUDIO/VIDEO"
        }
    }

    with open('sample_themes.json', 'w') as f:
        json.dump(sample, f, indent=2)

    print("Created sample_themes.json")
    return 'sample_themes.json'


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 batch_workflow.py themes.json")
        print("\nTo create a sample themes file:")
        print("  python3 batch_workflow.py --sample")
        sys.exit(1)

    if sys.argv[1] == '--sample':
        filepath = create_sample_themes()
    else:
        filepath = sys.argv[1]

    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        sys.exit(1)

    # Load and run
    config = load_themes(filepath)
    result = run_batch(config)

    # Save manifest
    save_manifest(result, config)

    # Print summary
    print(f"\n{'='*60}")
    print("BATCH COMPLETE")
    print(f"{'='*60}")
    print(f"Total: {result.total_prompts}")
    print(f"Successful: {result.successful}")
    print(f"Failed: {result.failed}")
    print(f"Duration: {result.started_at} to {result.completed_at}")


if __name__ == "__main__":
    main()
