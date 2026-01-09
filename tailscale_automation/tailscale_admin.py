#!/usr/bin/env python3
"""
Tailscale Admin Console Browser Automation

Automates Tailscale admin console via Chrome using AppleScript + JS injection.
Enables SSH, configures machine settings, manages ACLs.

Usage:
    from tailscale_admin import TailscaleAdmin

    ts = TailscaleAdmin()
    ts.enable_ssh_for_machine("beta")
"""

import subprocess
import json
import time
import os
import tempfile
from typing import Optional, Dict, List, Any
from dataclasses import dataclass


@dataclass
class MachineInfo:
    """Tailscale machine information"""
    name: str
    ip: str
    os: str
    ssh_enabled: bool
    online: bool


class TailscaleAdmin:
    """Automates Tailscale admin console via browser"""

    ADMIN_URL = "https://login.tailscale.com/admin/machines"
    MACHINE_URL = "https://login.tailscale.com/admin/machines/{machine_id}"
    ACL_URL = "https://login.tailscale.com/admin/acls"

    def __init__(self, poll_interval: int = 2, max_wait: int = 30):
        self.poll_interval = poll_interval
        self.max_wait = max_wait

    def _run_applescript(self, script: str) -> str:
        """Execute AppleScript and return result"""
        cmd = f'''osascript << 'EOF'
{script}
EOF'''
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout.strip()

    def _run_js_in_chrome(self, js_code: str) -> str:
        """Execute JavaScript in Chrome's active tab"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(js_code)
            js_file = f.name

        try:
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

    def _navigate(self, url: str) -> bool:
        """Navigate Chrome to URL"""
        script = f'''
tell application "Google Chrome"
    activate
    set URL of active tab of front window to "{url}"
end tell
delay 2
'''
        self._run_applescript(script)
        return True

    def _wait_for_page_load(self, timeout: int = 10) -> bool:
        """Wait for page to finish loading"""
        js = '''
(function() {
    return document.readyState === 'complete';
})();
'''
        start = time.time()
        while time.time() - start < timeout:
            result = self._run_js_in_chrome(js)
            if 'true' in result.lower():
                return True
            time.sleep(0.5)
        return False

    def navigate_to_machines(self) -> bool:
        """Navigate to machines list"""
        self._navigate(self.ADMIN_URL)
        return self._wait_for_page_load()

    def navigate_to_acls(self) -> bool:
        """Navigate to ACL editor"""
        self._navigate(self.ACL_URL)
        return self._wait_for_page_load()

    def get_machines_list(self) -> List[Dict[str, Any]]:
        """Get list of machines from admin console"""
        js = '''
(function() {
    const machines = [];
    // Find machine rows in the table
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
'''
        result = self._run_js_in_chrome(js)
        try:
            return json.loads(result)
        except:
            return []

    def find_machine_element(self, machine_name: str) -> bool:
        """Find and click on a machine by name"""
        js = f'''
(function() {{
    const name = {json.dumps(machine_name.lower())};

    // Find all links/elements containing machine name
    const links = document.querySelectorAll('a[href*="/machines/"]');

    for (const link of links) {{
        if (link.textContent.toLowerCase().includes(name)) {{
            link.click();
            return JSON.stringify({{success: true, found: link.textContent}});
        }}
    }}

    // Try table rows
    const rows = document.querySelectorAll('tr, div[class*="row"]');
    for (const row of rows) {{
        if (row.textContent.toLowerCase().includes(name)) {{
            const clickable = row.querySelector('a, button') || row;
            clickable.click();
            return JSON.stringify({{success: true, found: row.textContent.substring(0, 50)}});
        }}
    }}

    return JSON.stringify({{success: false, error: 'Machine not found'}});
}})();
'''
        result = self._run_js_in_chrome(js)
        try:
            data = json.loads(result)
            return data.get('success', False)
        except:
            return False

    def click_machine_menu(self) -> bool:
        """Click the machine settings/menu button"""
        js = '''
(function() {
    // Look for settings gear, three dots menu, or "Machine settings" button
    const selectors = [
        'button[aria-label*="settings"]',
        'button[aria-label*="menu"]',
        '[class*="MenuButton"]',
        '[class*="SettingsButton"]',
        'button[class*="more"]',
        '[data-testid="machine-menu"]',
        'button:has(svg[class*="gear"])',
        'button:has(svg[class*="dots"])'
    ];

    for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
            el.click();
            return JSON.stringify({success: true, selector: sel});
        }
    }

    // Fallback: find by text content
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
        if (btn.textContent.includes('Settings') || btn.textContent.includes('Edit')) {
            btn.click();
            return JSON.stringify({success: true, text: btn.textContent});
        }
    }

    return JSON.stringify({success: false, error: 'Menu button not found'});
})();
'''
        result = self._run_js_in_chrome(js)
        try:
            data = json.loads(result)
            return data.get('success', False)
        except:
            return False

    def enable_ssh_toggle(self) -> Dict[str, Any]:
        """Find and enable SSH toggle"""
        js = '''
(function() {
    // Look for SSH toggle/checkbox
    const selectors = [
        'input[type="checkbox"][name*="ssh"]',
        'input[type="checkbox"][id*="ssh"]',
        '[role="switch"][aria-label*="SSH"]',
        'label:has-text("SSH") input[type="checkbox"]',
        '[class*="Toggle"][class*="ssh"]'
    ];

    // First try specific selectors
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

    // Look for text "SSH" near a toggle
    const labels = document.querySelectorAll('label, span, div');
    for (const label of labels) {
        if (label.textContent.toLowerCase().includes('ssh') &&
            !label.textContent.toLowerCase().includes('keys')) {
            // Find nearby toggle
            const parent = label.closest('div[class*="row"], div[class*="setting"], tr');
            if (parent) {
                const toggle = parent.querySelector('input[type="checkbox"], [role="switch"], button[class*="toggle"]');
                if (toggle) {
                    toggle.click();
                    return JSON.stringify({success: true, action: 'clicked_near_ssh_label'});
                }
            }
        }
    }

    return JSON.stringify({success: false, error: 'SSH toggle not found'});
})();
'''
        result = self._run_js_in_chrome(js)
        try:
            return json.loads(result)
        except:
            return {'success': False, 'error': 'Parse error', 'raw': result}

    def save_changes(self) -> bool:
        """Click save button if present"""
        js = '''
(function() {
    const selectors = [
        'button[type="submit"]',
        'button:has-text("Save")',
        'button:has-text("Apply")',
        'button[class*="primary"]',
        'button[class*="save"]'
    ];

    for (const sel of selectors) {
        try {
            const el = document.querySelector(sel);
            if (el && el.textContent.toLowerCase().includes('save')) {
                el.click();
                return JSON.stringify({success: true});
            }
        } catch(e) {}
    }

    // Fallback
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
        if (btn.textContent.toLowerCase().includes('save')) {
            btn.click();
            return JSON.stringify({success: true, text: btn.textContent});
        }
    }

    return JSON.stringify({success: false, note: 'No save button - changes may auto-save'});
})();
'''
        result = self._run_js_in_chrome(js)
        try:
            data = json.loads(result)
            return data.get('success', False)
        except:
            return False

    def enable_ssh_for_machine(self, machine_name: str) -> Dict[str, Any]:
        """
        Full workflow to enable SSH for a machine.

        1. Navigate to machines list
        2. Click on the machine
        3. Find SSH settings
        4. Enable SSH
        5. Save
        """
        result = {'machine': machine_name, 'steps': []}

        # Step 1: Navigate to machines
        print(f"Navigating to machines list...")
        self.navigate_to_machines()
        time.sleep(2)
        result['steps'].append({'navigate': True})

        # Step 2: Find and click machine
        print(f"Finding machine: {machine_name}")
        if self.find_machine_element(machine_name):
            result['steps'].append({'find_machine': True})
            time.sleep(2)
        else:
            result['steps'].append({'find_machine': False})
            result['success'] = False
            result['error'] = f'Could not find machine: {machine_name}'
            return result

        # Step 3: Look for SSH toggle on machine page
        print("Looking for SSH settings...")
        time.sleep(1)
        ssh_result = self.enable_ssh_toggle()
        result['steps'].append({'ssh_toggle': ssh_result})

        if not ssh_result.get('success'):
            # Try clicking menu first
            print("Trying machine menu...")
            if self.click_machine_menu():
                time.sleep(1)
                ssh_result = self.enable_ssh_toggle()
                result['steps'].append({'ssh_toggle_after_menu': ssh_result})

        # Step 4: Save if needed
        self.save_changes()
        result['steps'].append({'save': True})

        result['success'] = ssh_result.get('success', False)
        return result

    def get_current_page_info(self) -> Dict[str, Any]:
        """Debug: Get info about current page"""
        js = '''
(function() {
    return JSON.stringify({
        url: window.location.href,
        title: document.title,
        bodyText: document.body.innerText.substring(0, 500)
    });
})();
'''
        result = self._run_js_in_chrome(js)
        try:
            return json.loads(result)
        except:
            return {'raw': result}


def main():
    """Test the automation"""
    ts = TailscaleAdmin()

    print("=== Tailscale Admin Automation ===")
    print()

    # Navigate and get page info
    print("Navigating to admin console...")
    ts.navigate_to_machines()
    time.sleep(3)

    info = ts.get_current_page_info()
    print(f"Current URL: {info.get('url', 'unknown')}")
    print(f"Page title: {info.get('title', 'unknown')}")
    print()

    # Get machines
    print("Getting machines list...")
    machines = ts.get_machines_list()
    print(f"Found {len(machines)} machines")
    for m in machines:
        print(f"  - {m}")


if __name__ == "__main__":
    main()
