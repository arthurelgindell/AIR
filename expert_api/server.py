"""
ARTHUR Expert Channel API

FastAPI server that exposes Claude Code expert channels as HTTP endpoints.
Runs on AIR and is accessible via Tailscale at air.tail5f2bae.ts.net

Endpoints:
- POST /{channel}/task - Submit task for async execution
- GET /status/{task_id} - Poll for task results
- GET /{channel}/recent - Get recent tasks for channel
- GET /health - Health check
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel
import subprocess
import json
import uuid
import time
from datetime import datetime
from typing import Optional, Dict, Any
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("expert_api")

# FastAPI app
app = FastAPI(
    title="ARTHUR Expert Channel API",
    description="HTTP API for triggering Claude Code expert channels via Tailscale",
    version="1.0.0"
)

# In-memory task store (consider Redis for production persistence)
tasks: Dict[str, Dict[str, Any]] = {}

# Valid expert channels
VALID_CHANNELS = ["claude-code", "lm-studio", "tailscale"]

# Project root for Claude Code execution
PROJECT_ROOT = "/Users/arthurdell/ARTHUR"

# Activity tracker script
ACTIVITY_TRACKER = f"{PROJECT_ROOT}/.claude/lib/activity-tracker.sh"


class TaskRequest(BaseModel):
    """Request body for task submission"""
    task: str
    context: dict = {}
    timeout: int = 300  # 5 minute default


class TaskSubmitResponse(BaseModel):
    """Response for task submission"""
    task_id: str
    channel: str
    status: str
    poll_url: str


class TaskStatusResponse(BaseModel):
    """Response for task status polling"""
    task_id: str
    channel: str
    status: str  # pending, running, completed, error
    result: Optional[str] = None
    error: Optional[str] = None
    submitted_at: str
    completed_at: Optional[str] = None
    duration: Optional[float] = None
    submitted_by: Optional[str] = None


def record_activity(channel: str, details: str = ""):
    """Record dispatch activity via activity-tracker.sh"""
    try:
        subprocess.run(
            [ACTIVITY_TRACKER, "dispatch", channel, details[:100]],
            capture_output=True,
            timeout=5
        )
    except Exception as e:
        logger.warning(f"Failed to record activity: {e}")


def execute_claude_task(
    task_id: str,
    channel: str,
    task: str,
    context: dict,
    timeout: int
):
    """
    Background worker: Execute task via Claude Code headless mode.

    Uses `claude -p` to run Claude Code in non-interactive mode,
    routing the task to the appropriate expert channel.
    """
    tasks[task_id]["status"] = "running"
    start_time = time.time()

    logger.info(f"[{task_id}] Starting task for {channel}: {task[:50]}...")

    # Build prompt that routes to the expert channel
    prompt = f"""You are the {channel} expert channel in the ARTHUR system.

## Task
{task}

## Context
{json.dumps(context, indent=2) if context else "No additional context provided."}

## Instructions
Execute this task using your domain expertise. Be concise and return actionable results.
If the task requires reading files or running commands within your domain, do so.
Return structured output when appropriate."""

    try:
        result = subprocess.run(
            ["claude", "-p", prompt, "--output-format", "json"],
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=PROJECT_ROOT
        )

        tasks[task_id]["status"] = "completed" if result.returncode == 0 else "error"
        tasks[task_id]["result"] = result.stdout

        if result.returncode != 0:
            tasks[task_id]["error"] = result.stderr
            logger.error(f"[{task_id}] Task failed: {result.stderr[:200]}")
        else:
            logger.info(f"[{task_id}] Task completed successfully")

    except subprocess.TimeoutExpired:
        tasks[task_id]["status"] = "error"
        tasks[task_id]["error"] = f"Task timed out after {timeout}s"
        logger.error(f"[{task_id}] Task timed out")

    except Exception as e:
        tasks[task_id]["status"] = "error"
        tasks[task_id]["error"] = str(e)
        logger.error(f"[{task_id}] Task exception: {e}")

    tasks[task_id]["completed_at"] = datetime.utcnow().isoformat()
    tasks[task_id]["duration"] = time.time() - start_time

    # Record activity to channel tracker
    record_activity(channel, task[:100])


@app.post("/{channel}/task", response_model=TaskSubmitResponse)
async def submit_task(
    channel: str,
    request: TaskRequest,
    background_tasks: BackgroundTasks,
    req: Request
):
    """
    Submit a task for async execution.

    Returns immediately with a task_id that can be polled for results.
    """
    if channel not in VALID_CHANNELS:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown channel: {channel}. Valid channels: {VALID_CHANNELS}"
        )

    task_id = str(uuid.uuid4())[:8]

    # Extract Tailscale identity from headers (set by tailscale serve)
    submitted_by = req.headers.get("Tailscale-User-Login", "unknown")

    logger.info(f"[{task_id}] Task submitted to {channel} by {submitted_by}")

    tasks[task_id] = {
        "task_id": task_id,
        "channel": channel,
        "status": "pending",
        "submitted_at": datetime.utcnow().isoformat(),
        "submitted_by": submitted_by,
        "result": None,
        "error": None,
        "completed_at": None,
        "duration": None
    }

    # Schedule background execution
    background_tasks.add_task(
        execute_claude_task,
        task_id,
        channel,
        request.task,
        request.context,
        request.timeout
    )

    return TaskSubmitResponse(
        task_id=task_id,
        channel=channel,
        status="pending",
        poll_url=f"/status/{task_id}"
    )


@app.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """
    Poll for task status and results.

    Returns the current status of the task. When status is "completed" or "error",
    the result/error field will be populated.
    """
    if task_id not in tasks:
        raise HTTPException(
            status_code=404,
            detail=f"Task not found: {task_id}"
        )

    return TaskStatusResponse(**tasks[task_id])


@app.get("/{channel}/recent")
async def get_recent_tasks(channel: str, limit: int = 10):
    """Get recent tasks for a channel."""
    if channel not in VALID_CHANNELS:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown channel: {channel}"
        )

    channel_tasks = [t for t in tasks.values() if t["channel"] == channel]
    sorted_tasks = sorted(
        channel_tasks,
        key=lambda x: x["submitted_at"],
        reverse=True
    )
    return sorted_tasks[:limit]


@app.get("/channels")
async def list_channels():
    """List available expert channels."""
    return {
        "channels": [
            {
                "id": "claude-code",
                "name": "Claude Code Expert",
                "description": "Claude API, prompt engineering, tool design"
            },
            {
                "id": "lm-studio",
                "name": "LM Studio Expert",
                "description": "Local LLM inference, model management"
            },
            {
                "id": "tailscale",
                "name": "Tailscale Expert",
                "description": "Network configuration, ACLs, serve management"
            }
        ]
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    pending = len([t for t in tasks.values() if t["status"] == "pending"])
    running = len([t for t in tasks.values() if t["status"] == "running"])
    completed = len([t for t in tasks.values() if t["status"] == "completed"])
    errors = len([t for t in tasks.values() if t["status"] == "error"])

    return {
        "status": "healthy",
        "channels": VALID_CHANNELS,
        "tasks": {
            "pending": pending,
            "running": running,
            "completed": completed,
            "errors": errors,
            "total": len(tasks)
        }
    }


@app.get("/")
async def root():
    """API root - redirect to docs."""
    return {
        "name": "ARTHUR Expert Channel API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "channels": "/channels"
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("ARTHUR Expert Channel API starting...")
    logger.info(f"Valid channels: {VALID_CHANNELS}")
    logger.info(f"Project root: {PROJECT_ROOT}")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("ARTHUR Expert Channel API shutting down...")
    # Could persist tasks to disk here if needed
