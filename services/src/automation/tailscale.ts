/**
 * Tailscale Admin Console Automation
 *
 * TypeScript port of tailscale_admin.py
 * Automates Tailscale admin console via Chrome using AppleScript + JS injection.
 */

import { runAppleScript, runJsInChrome } from "../lib/subprocess";

export interface MachineInfo {
  name: string;
  ip: string;
  os: string;
  sshEnabled?: boolean;
  online?: boolean;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export class TailscaleAdmin {
  private readonly adminUrl = "https://login.tailscale.com/admin/machines";
  private readonly aclUrl = "https://login.tailscale.com/admin/acls";
  private readonly pollInterval: number;
  private readonly maxWait: number;

  constructor(pollInterval = 2000, maxWait = 30000) {
    this.pollInterval = pollInterval;
    this.maxWait = maxWait;
  }

  /**
   * Navigate Chrome to a URL
   */
  private async navigate(url: string): Promise<boolean> {
    const script = `
tell application "Google Chrome"
    activate
    set URL of active tab of front window to "${url}"
end tell
delay 2
`;
    await runAppleScript(script);
    return true;
  }

  /**
   * Wait for page to finish loading
   */
  private async waitForPageLoad(timeout = 10000): Promise<boolean> {
    const js = `(function() { return document.readyState === 'complete'; })();`;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const result = await runJsInChrome(js);
      if (result.toLowerCase().includes("true")) {
        return true;
      }
      await Bun.sleep(500);
    }
    return false;
  }

  /**
   * Navigate to machines list
   */
  async navigateToMachines(): Promise<boolean> {
    await this.navigate(this.adminUrl);
    return this.waitForPageLoad();
  }

  /**
   * Navigate to ACL editor
   */
  async navigateToAcls(): Promise<boolean> {
    await this.navigate(this.aclUrl);
    return this.waitForPageLoad();
  }

  /**
   * Get list of machines from admin console
   */
  async getMachinesList(): Promise<MachineInfo[]> {
    const js = `
(function() {
    const machines = [];
    const rows = document.querySelectorAll('[data-testid="machine-row"], tr[class*="machine"], div[class*="MachineRow"]');

    rows.forEach(row => {
        const nameEl = row.querySelector('[class*="MachineName"], [class*="hostname"], a[href*="/machines/"]');
        const ipEl = row.querySelector('[class*="ip"], [class*="address"]');
        const osEl = row.querySelector('[class*="os"], [class*="platform"]');

        if (nameEl) {
            machines.push({
                name: nameEl.textContent.trim(),
                ip: ipEl ? ipEl.textContent.trim() : '',
                os: osEl ? osEl.textContent.trim() : ''
            });
        }
    });

    return JSON.stringify(machines);
})();
`;
    const result = await runJsInChrome(js);
    try {
      return JSON.parse(result);
    } catch {
      return [];
    }
  }

  /**
   * Find and click on a machine by name
   */
  async findMachineElement(machineName: string): Promise<boolean> {
    const js = `
(function() {
    const name = ${JSON.stringify(machineName.toLowerCase())};

    const links = document.querySelectorAll('a[href*="/machines/"]');
    for (const link of links) {
        if (link.textContent.toLowerCase().includes(name)) {
            link.click();
            return JSON.stringify({success: true, found: link.textContent});
        }
    }

    const rows = document.querySelectorAll('tr, div[class*="row"]');
    for (const row of rows) {
        if (row.textContent.toLowerCase().includes(name)) {
            const clickable = row.querySelector('a, button') || row;
            clickable.click();
            return JSON.stringify({success: true, found: row.textContent.substring(0, 50)});
        }
    }

    return JSON.stringify({success: false, error: 'Machine not found'});
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
   * Click the machine settings/menu button
   */
  async clickMachineMenu(): Promise<boolean> {
    const js = `
(function() {
    const selectors = [
        'button[aria-label*="settings"]',
        'button[aria-label*="menu"]',
        '[class*="MenuButton"]',
        '[class*="SettingsButton"]',
        'button[class*="more"]',
        '[data-testid="machine-menu"]'
    ];

    for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
            el.click();
            return JSON.stringify({success: true, selector: sel});
        }
    }

    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
        if (btn.textContent.includes('Settings') || btn.textContent.includes('Edit')) {
            btn.click();
            return JSON.stringify({success: true, text: btn.textContent});
        }
    }

    return JSON.stringify({success: false, error: 'Menu button not found'});
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
   * Find and enable SSH toggle
   */
  async enableSshToggle(): Promise<ActionResult> {
    const js = `
(function() {
    const selectors = [
        'input[type="checkbox"][name*="ssh"]',
        'input[type="checkbox"][id*="ssh"]',
        '[role="switch"][aria-label*="SSH"]'
    ];

    for (const sel of selectors) {
        try {
            const el = document.querySelector(sel);
            if (el) {
                if (!el.checked) {
                    el.click();
                    return JSON.stringify({success: true, action: 'enabled', selector: sel});
                } else {
                    return JSON.stringify({success: true, action: 'already_enabled', selector: sel});
                }
            }
        } catch(e) {}
    }

    const labels = document.querySelectorAll('label, span, div');
    for (const label of labels) {
        if (label.textContent.toLowerCase().includes('ssh') &&
            !label.textContent.toLowerCase().includes('keys')) {
            const parent = label.closest('div[class*="row"], div[class*="setting"], tr');
            if (parent) {
                const toggle = parent.querySelector('input[type="checkbox"], [role="switch"]');
                if (toggle) {
                    toggle.click();
                    return JSON.stringify({success: true, action: 'clicked_near_ssh_label'});
                }
            }
        }
    }

    return JSON.stringify({success: false, error: 'SSH toggle not found'});
})();
`;
    const result = await runJsInChrome(js);
    try {
      return JSON.parse(result);
    } catch {
      return { success: false, error: "Parse error", data: result };
    }
  }

  /**
   * Click save button if present
   */
  async saveChanges(): Promise<boolean> {
    const js = `
(function() {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
        if (btn.textContent.toLowerCase().includes('save')) {
            btn.click();
            return JSON.stringify({success: true, text: btn.textContent});
        }
    }

    return JSON.stringify({success: false, note: 'No save button - changes may auto-save'});
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
   * Full workflow to enable SSH for a machine
   */
  async enableSshForMachine(machineName: string): Promise<ActionResult> {
    const steps: Record<string, unknown>[] = [];

    // Step 1: Navigate to machines
    console.log("Navigating to machines list...");
    await this.navigateToMachines();
    await Bun.sleep(2000);
    steps.push({ navigate: true });

    // Step 2: Find and click machine
    console.log(`Finding machine: ${machineName}`);
    if (await this.findMachineElement(machineName)) {
      steps.push({ find_machine: true });
      await Bun.sleep(2000);
    } else {
      steps.push({ find_machine: false });
      return {
        success: false,
        error: `Could not find machine: ${machineName}`,
        data: { steps },
      };
    }

    // Step 3: Look for SSH toggle
    console.log("Looking for SSH settings...");
    await Bun.sleep(1000);
    let sshResult = await this.enableSshToggle();
    steps.push({ ssh_toggle: sshResult });

    if (!sshResult.success) {
      // Try clicking menu first
      console.log("Trying machine menu...");
      if (await this.clickMachineMenu()) {
        await Bun.sleep(1000);
        sshResult = await this.enableSshToggle();
        steps.push({ ssh_toggle_after_menu: sshResult });
      }
    }

    // Step 4: Save if needed
    await this.saveChanges();
    steps.push({ save: true });

    return {
      success: sshResult.success ?? false,
      data: { machine: machineName, steps },
    };
  }

  /**
   * Get info about current page (for debugging)
   */
  async getCurrentPageInfo(): Promise<Record<string, unknown>> {
    const js = `
(function() {
    return JSON.stringify({
        url: window.location.href,
        title: document.title,
        bodyText: document.body.innerText.substring(0, 500)
    });
})();
`;
    const result = await runJsInChrome(js);
    try {
      return JSON.parse(result);
    } catch {
      return { raw: result };
    }
  }
}

// CLI interface
if (import.meta.main) {
  const ts = new TailscaleAdmin();

  console.log("=== Tailscale Admin Automation ===\n");

  console.log("Navigating to admin console...");
  await ts.navigateToMachines();
  await Bun.sleep(3000);

  const info = await ts.getCurrentPageInfo();
  console.log(`Current URL: ${info.url}`);
  console.log(`Page title: ${info.title}\n`);

  console.log("Getting machines list...");
  const machines = await ts.getMachinesList();
  console.log(`Found ${machines.length} machines`);
  machines.forEach((m) => console.log(`  - ${m.name} (${m.ip})`));
}
