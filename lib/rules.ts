import { AdvicePack, Signal, FixAction } from "../types";

/**
 * Utility type guard to check if an object is a valid Signal.
 * @param obj The object to check.
 * @returns True if the object is a Signal, false otherwise.
 */
export const isSignal = (obj: unknown): obj is Signal =>
  typeof obj === "object" &&
  obj !== null &&
  typeof (obj as any).key === "string" &&
  typeof (obj as any).label === "string";

/**
 * The default advice pack containing a set of security rules.
 */
export const defaultAdvicePack: AdvicePack = {
  id: "core-hardening-1",
  title: "Core Hardening & Exposure Checks",
  evaluate(signals) {
    const actions: FixAction[] = [];
    const findSignal = (key: string) => signals.find(s => s.key === key);

    const firewallSignal = findSignal('firewall.enabled');
    if (firewallSignal && firewallSignal.value === false) {
        actions.push({
            id: 'enable-firewall',
            title: 'Firewall Status is Disabled',
            severity: 'high',
            category: 'Network',
            description: 'The system firewall provides a critical defense against network-based threats. It should be enabled at all times.',
            scripts: {
                windows: 'netsh advfirewall set allprofiles state on',
                linux: 'sudo ufw enable',
                mac: 'sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on'
            },
            references: [{ label: 'About Firewalls', href: 'https://en.wikipedia.org/wiki/Firewall_(computing)' }],
            tags: ['networking', 'defense']
        });
    }

    const osSignal = findSignal('os.version');
    if (osSignal && osSignal.meta?.latest && osSignal.value !== osSignal.meta.latest) {
        actions.push({
            id: 'update-os',
            title: 'Operating System is Outdated',
            severity: 'medium',
            category: 'OS',
            description: `The system is running version ${osSignal.value}, but the latest is ${osSignal.meta.latest}. Updates contain important security patches.`,
            scripts: {
                windows: 'wuauclt /detectnow /updatenow',
                linux: 'sudo apt-get update && sudo apt-get upgrade -y',
                mac: 'sudo softwareupdate -i -a'
            },
            tags: ['patching']
        });
    }
    
    const passSignal = findSignal('auth.password_policy');
    if (passSignal && typeof passSignal.value === 'object' && passSignal.value !== null && ((passSignal.value as any).minLength < 8)) {
         actions.push({
            id: 'strengthen-password-policy',
            title: 'Weak Password Policy Detected',
            severity: 'low',
            category: 'Auth',
            description: 'The current password policy allows for short passwords. Enforce a minimum length of at least 8 characters.',
            references: [{ label: 'NIST Password Guidelines', href: 'https://pages.nist.gov/800-63-3/sp800-63b.html' }],
            tags: ['authentication', 'compliance']
        });
    }
    
    const telemetrySignal = findSignal('privacy.telemetry');
    if (telemetrySignal && telemetrySignal.value === true) {
        actions.push({
            id: 'disable-telemetry',
            title: 'Basic Telemetry is Enabled',
            severity: 'low',
            category: 'Privacy',
            description: 'While often harmless, non-essential data collection can be a privacy risk. Consider disabling it.',
            tags: ['privacy']
        });
    }

    return actions;
  },
};
