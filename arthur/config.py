"""
ARTHUR Configuration
Centralized configuration dataclasses
"""

import os
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class PostmarkConfig:
    """Postmark email notification configuration"""
    server_token: str = field(default_factory=lambda: os.getenv("POSTMARK_SERVER_TOKEN", ""))
    default_sender: str = "alerts@dellight.ai"
    default_recipient: str = "arthur.dell@dellight.ai"
    message_stream: str = "outbound"


@dataclass
class ProjectConfig:
    """Project paths and settings"""
    root: Path = Path("/Users/arthurdell/ARTHUR")
    context_dir: Path = field(default_factory=lambda: Path("/Users/arthurdell/ARTHUR/.claude/context"))
    logs_dir: Path = field(default_factory=lambda: Path("/Users/arthurdell/ARTHUR/logs"))
    mj_automation_dir: Path = field(default_factory=lambda: Path("/Users/arthurdell/ARTHUR/mj_automation"))


# Singleton instances
POSTMARK = PostmarkConfig()
PROJECT = ProjectConfig()
