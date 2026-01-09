/**
 * ARTHUR Expert Channel API
 *
 * TypeScript/Hono port of the FastAPI expert_api server.
 * Exposes Claude Code expert channels as HTTP endpoints.
 *
 * Runs on AIR and is accessible via Tailscale at air.tail5f2bae.ts.net
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { runClaude, recordActivity } from "../lib/subprocess";

// Types
interface Task {
  task_id: string;
  channel: string;
  status: "pending" | "running" | "completed" | "error";
  result: string | null;
  error: string | null;
  submitted_at: string;
  completed_at: string | null;
  duration: number | null;
  submitted_by: string;
}

interface TaskRequest {
  task: string;
  context?: Record<string, unknown>;
  timeout?: number;
}

// Constants
const VALID_CHANNELS = ["claude-code", "lm-studio", "tailscale"] as const;
type Channel = (typeof VALID_CHANNELS)[number];

const PROJECT_ROOT = "/Users/arthurdell/ARTHUR";

// In-memory task store
const tasks = new Map<string, Task>();

// Create Hono app
const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Helper: Generate short UUID
function generateTaskId(): string {
  return crypto.randomUUID().slice(0, 8);
}

// Helper: Execute Claude task in background
async function executeClaudeTask(
  taskId: string,
  channel: Channel,
  taskText: string,
  context: Record<string, unknown>,
  timeout: number
): Promise<void> {
  const task = tasks.get(taskId);
  if (!task) return;

  task.status = "running";
  const startTime = Date.now();

  console.log(`[${taskId}] Starting task for ${channel}: ${taskText.slice(0, 50)}...`);

  const prompt = `You are the ${channel} expert channel in the ARTHUR system.

## Task
${taskText}

## Context
${Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : "No additional context provided."}

## Instructions
Execute this task using your domain expertise. Be concise and return actionable results.
If the task requires reading files or running commands within your domain, do so.
Return structured output when appropriate.`;

  try {
    const result = await runClaude(prompt, {
      timeout,
      cwd: PROJECT_ROOT,
    });

    task.status = result.success ? "completed" : "error";
    task.result = result.stdout;

    if (!result.success) {
      task.error = result.stderr;
      console.error(`[${taskId}] Task failed: ${result.stderr.slice(0, 200)}`);
    } else {
      console.log(`[${taskId}] Task completed successfully`);
    }
  } catch (error) {
    task.status = "error";
    task.error = error instanceof Error ? error.message : String(error);
    console.error(`[${taskId}] Task exception: ${task.error}`);
  }

  task.completed_at = new Date().toISOString();
  task.duration = (Date.now() - startTime) / 1000;

  // Record activity
  await recordActivity("dispatch", channel, taskText.slice(0, 100));
}

// Routes

// Root
app.get("/", (c) => {
  return c.json({
    name: "ARTHUR Expert Channel API",
    version: "2.0.0",
    runtime: "Bun + Hono",
    docs: "/docs",
    health: "/health",
    channels: "/channels",
  });
});

// Health check
app.get("/health", (c) => {
  const taskArray = Array.from(tasks.values());
  return c.json({
    status: "healthy",
    runtime: `Bun ${Bun.version}`,
    channels: VALID_CHANNELS,
    tasks: {
      pending: taskArray.filter((t) => t.status === "pending").length,
      running: taskArray.filter((t) => t.status === "running").length,
      completed: taskArray.filter((t) => t.status === "completed").length,
      errors: taskArray.filter((t) => t.status === "error").length,
      total: tasks.size,
    },
  });
});

// List channels
app.get("/channels", (c) => {
  return c.json({
    channels: [
      {
        id: "claude-code",
        name: "Claude Code Expert",
        description: "Claude API, prompt engineering, tool design",
      },
      {
        id: "lm-studio",
        name: "LM Studio Expert",
        description: "Local LLM inference, model management",
      },
      {
        id: "tailscale",
        name: "Tailscale Expert",
        description: "Network configuration, ACLs, serve management",
      },
    ],
  });
});

// Submit task
app.post("/:channel/task", async (c) => {
  const channel = c.req.param("channel") as Channel;

  if (!VALID_CHANNELS.includes(channel)) {
    return c.json(
      {
        error: `Unknown channel: ${channel}. Valid channels: ${VALID_CHANNELS.join(", ")}`,
      },
      404
    );
  }

  const body = await c.req.json<TaskRequest>();
  const { task: taskText, context = {}, timeout = 300000 } = body;

  if (!taskText) {
    return c.json({ error: "Missing 'task' field in request body" }, 400);
  }

  const taskId = generateTaskId();

  // Get Tailscale identity from headers
  const submittedBy = c.req.header("Tailscale-User-Login") ?? "unknown";

  console.log(`[${taskId}] Task submitted to ${channel} by ${submittedBy}`);

  const task: Task = {
    task_id: taskId,
    channel,
    status: "pending",
    submitted_at: new Date().toISOString(),
    submitted_by: submittedBy,
    result: null,
    error: null,
    completed_at: null,
    duration: null,
  };

  tasks.set(taskId, task);

  // Execute in background (non-blocking)
  executeClaudeTask(taskId, channel, taskText, context, timeout);

  return c.json({
    task_id: taskId,
    channel,
    status: "pending",
    poll_url: `/status/${taskId}`,
  });
});

// Get task status
app.get("/status/:taskId", (c) => {
  const taskId = c.req.param("taskId");
  const task = tasks.get(taskId);

  if (!task) {
    return c.json({ error: `Task not found: ${taskId}` }, 404);
  }

  return c.json(task);
});

// Get recent tasks for channel
app.get("/:channel/recent", (c) => {
  const channel = c.req.param("channel") as Channel;
  const limit = parseInt(c.req.query("limit") ?? "10");

  if (!VALID_CHANNELS.includes(channel)) {
    return c.json({ error: `Unknown channel: ${channel}` }, 404);
  }

  const channelTasks = Array.from(tasks.values())
    .filter((t) => t.channel === channel)
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
    .slice(0, limit);

  return c.json(channelTasks);
});

export default app;
export { app };
