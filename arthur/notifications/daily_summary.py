"""
Daily Summary Generator - AIR Node
Aggregates work performed in last 24 hours for ARTHUR project
Reports from AIR node to infrastructure status
"""

import os
import re
import subprocess
import socket
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Node identification
NODE_ID = "AIR"
NODE_ROLE = "Development & Automation Controller"

# Project paths
PROJECT_ROOT = Path("/Users/arthurdell/ARTHUR")
CONTEXT_DIR = PROJECT_ROOT / ".claude" / "context"
MJ_AUTOMATION_DIR = PROJECT_ROOT / "mj_automation"

# Remote storage paths (mounted volumes)
REMOTE_IMAGES_BASE = Path("/Volumes/STUDIO/IMAGES")
REMOTE_VIDEO_BASE = Path("/Volumes/STUDIO/VIDEO")

# Local download cache (if used)
LOCAL_DOWNLOADS = PROJECT_ROOT / "downloads"


@dataclass
class DailySummary:
    """Data structure for daily work summary"""
    date: datetime
    node_id: str = NODE_ID
    images_created: int = 0
    images_size_mb: float = 0.0
    videos_created: int = 0
    videos_duration_sec: float = 0.0
    carousels_created: int = 0
    tasks_completed: list[str] = field(default_factory=list)
    decisions_made: list[str] = field(default_factory=list)
    infrastructure_status: dict[str, str] = field(default_factory=dict)
    commits: list[str] = field(default_factory=list)
    commit_count: int = 0
    mj_batches_run: int = 0
    # AIR node metrics
    air_uptime_hours: float = 0.0
    air_disk_free_gb: float = 0.0
    air_memory_used_pct: float = 0.0


def _get_files_created_since(directory: Path, since: datetime, extensions: list[str]) -> tuple[int, float]:
    """Count files created since a given time"""
    if not directory.exists():
        return 0, 0.0

    count = 0
    total_size = 0

    try:
        # Walk directory tree for nested year/batch folders
        for root, dirs, files in os.walk(directory):
            for f in files:
                filepath = Path(root) / f
                if filepath.suffix.lower() in extensions:
                    try:
                        mtime = datetime.fromtimestamp(filepath.stat().st_mtime)
                        if mtime >= since:
                            count += 1
                            total_size += filepath.stat().st_size
                    except (OSError, PermissionError):
                        continue
    except Exception as e:
        logger.warning(f"Error scanning {directory}: {e}")

    return count, total_size / (1024 * 1024)


def _parse_progress_file(since: datetime) -> list[str]:
    """Extract completed tasks from progress.md"""
    progress_file = CONTEXT_DIR / "progress.md"
    if not progress_file.exists():
        return []

    tasks = []
    try:
        content = progress_file.read_text()
        # Look for completed checkboxes: - [x] Task description
        for match in re.finditer(r'-\s*\[x\]\s*(.+)', content, re.IGNORECASE):
            task = match.group(1).strip()
            if task and len(task) > 3:
                tasks.append(task[:100])
    except Exception as e:
        logger.warning(f"Error parsing progress.md: {e}")

    return tasks[:10]


def _parse_decisions_file(since: datetime) -> list[str]:
    """Extract recent decisions from decisions.md"""
    decisions_file = CONTEXT_DIR / "decisions.md"
    if not decisions_file.exists():
        return []

    decisions = []
    try:
        content = decisions_file.read_text()
        # Look for decision headers or bullet points
        for match in re.finditer(r'##\s*(.+)|^\s*[-*]\s*\*\*(.+?)\*\*', content, re.MULTILINE):
            decision = (match.group(1) or match.group(2) or "").strip()
            if decision and len(decision) > 5 and not decision.startswith('#'):
                decisions.append(decision[:80])
    except Exception as e:
        logger.warning(f"Error parsing decisions.md: {e}")

    return decisions[:5]


def _get_git_commits(since: datetime) -> tuple[list[str], int]:
    """Get git commits from last 24 hours"""
    commits = []
    count = 0

    try:
        result = subprocess.run(
            ["git", "log", "--since=24 hours ago", "--oneline", "--no-merges"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode == 0 and result.stdout.strip():
            lines = result.stdout.strip().split('\n')
            count = len(lines)
            for line in lines[:5]:
                parts = line.split(' ', 1)
                if len(parts) > 1:
                    commits.append(parts[1][:60])

    except Exception as e:
        logger.warning(f"Error getting git commits: {e}")

    return commits, count


def _get_air_metrics() -> tuple[float, float, float]:
    """Get AIR node system metrics: uptime, disk free, memory used"""
    uptime_hours = 0.0
    disk_free_gb = 0.0
    memory_used_pct = 0.0

    # Get uptime
    try:
        result = subprocess.run(
            ["sysctl", "-n", "kern.boottime"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            # Parse: { sec = 1704567890, usec = 0 }
            import re
            match = re.search(r'sec\s*=\s*(\d+)', result.stdout)
            if match:
                boot_time = int(match.group(1))
                uptime_hours = (datetime.now().timestamp() - boot_time) / 3600
    except Exception as e:
        logger.warning(f"Error getting uptime: {e}")

    # Get disk free space on root volume
    try:
        result = subprocess.run(
            ["df", "-g", "/"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            if len(lines) > 1:
                parts = lines[1].split()
                if len(parts) >= 4:
                    disk_free_gb = float(parts[3])
    except Exception as e:
        logger.warning(f"Error getting disk space: {e}")

    # Get memory usage
    try:
        result = subprocess.run(
            ["vm_stat"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            # Parse vm_stat output
            lines = result.stdout.strip().split('\n')
            stats = {}
            for line in lines:
                if ':' in line:
                    key, val = line.split(':', 1)
                    val = val.strip().rstrip('.')
                    try:
                        stats[key.strip()] = int(val)
                    except ValueError:
                        pass

            page_size = 16384  # Apple Silicon default
            free = stats.get('Pages free', 0) * page_size
            active = stats.get('Pages active', 0) * page_size
            inactive = stats.get('Pages inactive', 0) * page_size
            wired = stats.get('Pages wired down', 0) * page_size

            total_used = active + wired
            total_mem = free + active + inactive + wired
            if total_mem > 0:
                memory_used_pct = (total_used / total_mem) * 100
    except Exception as e:
        logger.warning(f"Error getting memory stats: {e}")

    return uptime_hours, disk_free_gb, memory_used_pct


def _check_infrastructure() -> dict[str, str]:
    """Check infrastructure health status - AIR node plus remotes"""
    status = {}

    # AIR node is always the source - mark it explicitly
    status["AIR"] = "✅"

    # Check remote hosts via SSH
    hosts = ["alpha", "beta", "gamma"]
    for host in hosts:
        try:
            result = subprocess.run(
                ["ssh", "-o", "ConnectTimeout=5", "-o", "BatchMode=yes", host, "echo ok"],
                capture_output=True,
                text=True,
                timeout=10
            )
            status[host.upper()] = "✅" if result.returncode == 0 else "❌"
        except subprocess.TimeoutExpired:
            status[host.upper()] = "⏱️"
        except Exception:
            status[host.upper()] = "❓"

    # Check mounted volumes
    if REMOTE_IMAGES_BASE.exists():
        status["STUDIO"] = "✅"
    else:
        status["STUDIO"] = "❌"

    return status


def _count_mj_batches(since: datetime) -> int:
    """Count MJ batch manifests created in the time period"""
    count = 0
    year = datetime.now().strftime('%Y')

    # Check remote images path for batch manifests
    batches_dir = REMOTE_IMAGES_BASE / year
    if batches_dir.exists():
        try:
            for batch_dir in batches_dir.iterdir():
                if batch_dir.is_dir():
                    manifest = batch_dir / "manifest.json"
                    if manifest.exists():
                        mtime = datetime.fromtimestamp(manifest.stat().st_mtime)
                        if mtime >= since:
                            count += 1
        except Exception as e:
            logger.warning(f"Error counting batches: {e}")

    return count


def generate_daily_summary(lookback_hours: int = 24, check_infrastructure: bool = True) -> DailySummary:
    """Generate summary of work performed from AIR node"""
    now = datetime.now()
    since = now - timedelta(hours=lookback_hours)
    year = now.strftime('%Y')

    summary = DailySummary(date=now, node_id=NODE_ID)

    # Get AIR node metrics
    summary.air_uptime_hours, summary.air_disk_free_gb, summary.air_memory_used_pct = _get_air_metrics()

    # Count images from remote storage
    images_dir = REMOTE_IMAGES_BASE / year
    summary.images_created, summary.images_size_mb = _get_files_created_since(
        images_dir, since, ['.png', '.jpg', '.jpeg', '.webp']
    )

    # Also check local downloads if remote not available
    if summary.images_created == 0 and LOCAL_DOWNLOADS.exists():
        summary.images_created, summary.images_size_mb = _get_files_created_since(
            LOCAL_DOWNLOADS, since, ['.png', '.jpg', '.jpeg', '.webp']
        )

    # Count videos
    videos_dir = REMOTE_VIDEO_BASE / year
    summary.videos_created, _ = _get_files_created_since(
        videos_dir, since, ['.mp4', '.mov', '.webm']
    )
    # Estimate 10s per video average
    summary.videos_duration_sec = summary.videos_created * 10

    # Count MJ batches
    summary.mj_batches_run = _count_mj_batches(since)

    # Parse state files
    summary.tasks_completed = _parse_progress_file(since)
    summary.decisions_made = _parse_decisions_file(since)

    # Git commits
    summary.commits, summary.commit_count = _get_git_commits(since)

    # Infrastructure status
    if check_infrastructure:
        summary.infrastructure_status = _check_infrastructure()

    return summary


def format_email_body(summary: DailySummary) -> str:
    """Format DailySummary as email body with AIR node branding"""
    hostname = socket.gethostname()
    date_str = summary.date.strftime("%Y-%m-%d")
    time_str = summary.date.strftime("%H:%M")

    lines = [
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        f"[{NODE_ID}] ARTHUR Daily Summary - {date_str}",
        f"Source: {NODE_ID} Node ({NODE_ROLE})",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        f"{NODE_ID} NODE STATUS",
        f"  Uptime: {summary.air_uptime_hours:.1f} hours",
        f"  Disk Free: {summary.air_disk_free_gb:.0f} GB",
        f"  Memory Used: {summary.air_memory_used_pct:.1f}%",
        "",
        "PRODUCTION METRICS (Last 24 Hours)",
        f"  Images: {summary.images_created} created ({summary.images_size_mb:.1f}MB)",
        f"  Videos: {summary.videos_created} generated ({summary.videos_duration_sec:.0f}s total)",
        f"  MJ Batches: {summary.mj_batches_run} completed",
        "",
    ]

    if summary.tasks_completed:
        lines.append("WORK COMPLETED")
        for task in summary.tasks_completed[:5]:
            lines.append(f"  [x] {task}")
        lines.append("")

    if summary.decisions_made:
        lines.append("DECISIONS MADE")
        for decision in summary.decisions_made[:3]:
            lines.append(f"  * {decision}")
        lines.append("")

    if summary.infrastructure_status:
        lines.append("INFRASTRUCTURE STATUS")
        status_parts = []
        for name, status in summary.infrastructure_status.items():
            status_parts.append(f"{name}: {status}")
        # Split into rows of 3
        for i in range(0, len(status_parts), 3):
            lines.append("  " + "  ".join(status_parts[i:i+3]))
        lines.append("")

    if summary.commit_count > 0:
        lines.append("CODE CHANGES")
        lines.append(f"  {summary.commit_count} commits")
        for commit in summary.commits[:3]:
            lines.append(f"    - {commit}")
        lines.append("")

    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    lines.append(f"Generated at {time_str} from {NODE_ID} ({hostname})")
    lines.append("ARTHUR - Autonomous Runtime Through Unified Resources")

    return "\n".join(lines)


def format_email_subject(summary: DailySummary) -> str:
    """Generate email subject line with AIR node identification"""
    date_str = summary.date.strftime("%Y-%m-%d")

    # Build activity indicator
    activities = []
    if summary.images_created > 0:
        activities.append(f"{summary.images_created} imgs")
    if summary.videos_created > 0:
        activities.append(f"{summary.videos_created} vids")
    if summary.commit_count > 0:
        activities.append(f"{summary.commit_count} commits")

    activity_str = ", ".join(activities) if activities else "No activity"

    return f"[{NODE_ID}] ARTHUR Daily - {date_str} ({activity_str})"
