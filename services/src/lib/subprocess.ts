/**
 * Subprocess utilities for Bun
 * Provides typed wrappers for spawning child processes
 */

import { spawn } from "bun";

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

/**
 * Run a command and return the result
 */
export async function runCommand(
  cmd: string[],
  options: Record<string, unknown> = {}
): Promise<CommandResult> {
  const proc = spawn(cmd, {
    stdout: "pipe",
    stderr: "pipe",
    ...options,
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return {
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    exitCode,
    success: exitCode === 0,
  };
}

/**
 * Run Claude Code in headless mode
 */
export async function runClaude(
  prompt: string,
  options: {
    timeout?: number;
    cwd?: string;
    outputFormat?: "json" | "text" | "stream-json";
  } = {}
): Promise<CommandResult> {
  const {
    timeout = 300000, // 5 minutes default
    cwd = "/Users/arthurdell/ARTHUR",
    outputFormat = "json",
  } = options;

  const cmd = ["claude", "-p", prompt, "--output-format", outputFormat];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const result = await runCommand(cmd, {
      cwd,
      signal: controller.signal,
    });
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Run AppleScript
 */
export async function runAppleScript(script: string): Promise<CommandResult> {
  return runCommand(["osascript", "-e", script]);
}

/**
 * Run JavaScript in Chrome via AppleScript
 */
export async function runJsInChrome(jsCode: string): Promise<string> {
  // Write JS to temp file to avoid escaping issues
  const tempFile = `/tmp/chrome_js_${Date.now()}.js`;
  await Bun.write(tempFile, jsCode);

  const script = `
set jsCode to read POSIX file "${tempFile}" as «class utf8»
tell application "Google Chrome"
    tell active tab of front window
        execute javascript jsCode
    end tell
end tell
`;

  const result = await runAppleScript(script);

  // Clean up temp file
  await Bun.spawn(["rm", tempFile]).exited;

  return result.stdout;
}

/**
 * Record activity via activity-tracker.sh
 */
export async function recordActivity(
  action: string,
  channel: string,
  details: string = ""
): Promise<void> {
  const tracker = "/Users/arthurdell/ARTHUR/.claude/lib/activity-tracker.sh";
  await runCommand([tracker, action, channel, details.slice(0, 100)]);
}
