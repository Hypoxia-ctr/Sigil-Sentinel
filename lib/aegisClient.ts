export const chat = async (command: string): Promise<string> => {
  console.log(`[Aegis Mock] Received command: ${command}`);
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000)); // Simulate network delay
  if (command === 'run quickscan') {
    return 'Quick scan complete. No immediate threats found.';
  }
  if (command.includes('firewall')) {
      const action = command.includes('enable') ? 'enabled' : 'disabled';
      return `Firewall has been ${action}.`;
  }
  if (command.includes('updates')) {
    return 'System is up to date. No new grimoires found.'
  }
  if (command.includes('logs')) {
    return 'Log export initiated to /var/log/sigil_sentinel.log.gz'
  }
  return `Command "${command}" executed successfully.`;
};

export const events = async (): Promise<any[]> => {
  console.log('[Aegis Mock] Fetching events...');
  return [];
};
