import React, { useMemo } from "react";
import AegisTerminal from "../AegisTerminal";

// Define a more structured type for commands
type Command = {
  description: string;
  aliases?: string[];
  handler: (args: string[]) => Promise<string | void> | string | void;
};

// Define the command map with descriptions, aliases, and handlers
const commandMap: Record<string, Command> = {
  'help': {
    description: 'Displays a list of available commands or details about a specific command.\nUsage: help [command]',
    handler: async (args) => {
      const commandName = args[0];
      if (commandName) {
        // Create a reverse mapping from aliases to primary command names
        const aliasMap: Record<string, string> = {};
        Object.entries(commandMap).forEach(([key, { aliases }]) => {
          aliases?.forEach(alias => { aliasMap[alias] = key; });
        });

        const cmdKey = aliasMap[commandName] || commandName;
        const cmd = commandMap[cmdKey];

        if (cmd) {
          let helpText = `Command: ${cmdKey}\n  ${cmd.description}`;
          if (cmd.aliases && cmd.aliases.length > 0) {
            helpText += `\n  Aliases: ${cmd.aliases.join(', ')}`;
          }
          return helpText;
        }
        return `Unknown command: '${commandName}'. Type 'help' to see all commands.`;
      }
      // List all commands
      return 'Available Commands:\n' + Object.entries(commandMap)
        .map(([name, { description }]) => `  ${name.padEnd(20, ' ')} - ${description.split('\n')[0]}`)
        .join('\n');
    },
  },
  'run quickscan': {
    description: 'Performs a quick scan of the system for immediate threats.',
    handler: async () => {
      await new Promise((r) => setTimeout(r, 650));
      return "Quick scan complete — 0 threats found.";
    },
  },
  'show status': {
    description: 'Displays the current status of key system components.',
    aliases: ['status'],
    handler: async () => {
      return "System: OK\nTelemetry: Off\nFirewall: Enabled";
    },
  },
  'harden': {
    description: 'Applies a security hardening policy.\nUsage: harden [policy_name]',
    handler: async (args) => {
        const policy = args.join(' ') || 'default';
        return `Simulated: applied policy for '${policy}' (dry-run).`;
    },
  },
  'list wards': {
    description: 'Lists all active security wards.',
    aliases: ['ls'],
    handler: async () => {
        return "Active Wards:\n- sysctl-secure\n- auditd-rules\n- nftables-baseline";
    }
  }
};

const initialOutput = [{
    cmd: '',
    output: `Sigil Sentinel Admin Console [v2.0.1]\nConnected to localhost. Type 'help' for a list of commands.`,
    time: Date.now()
}];


const AdminConsole: React.FC = () => {
  const { onExecute, knownCommands } = useMemo(() => {
    const aliasMap: Record<string, string> = {};
    Object.entries(commandMap).forEach(([command, { aliases }]) => {
      if (aliases) {
        aliases.forEach(alias => {
          aliasMap[alias] = command;
        });
      }
    });

    const execute = (cmdStr: string): Promise<string | void> | string | void => {
        const trimmedCmd = cmdStr.trim();
        
        // Check for an exact match first (for multi-word commands)
        let commandDef = commandMap[trimmedCmd];
        let args: string[] = [];

        if (commandDef) {
            return commandDef.handler(args);
        }
        
        // If no exact match, parse command and args
        const parts = trimmedCmd.split(/\s+/);
        let commandName = parts[0];
        args = parts.slice(1);

        // Check if the command is an alias
        const primaryCommandFromAlias = aliasMap[commandName];
        if (primaryCommandFromAlias) {
            commandName = primaryCommandFromAlias;
        }

        commandDef = commandMap[commandName];

        if (commandDef) {
            return commandDef.handler(args);
        }

        // Special handling for `harden [policy]` since `harden` is the key
        if(commandName === 'harden' && commandMap['harden']){
            return commandMap['harden'].handler(args);
        }

        return `Unknown command: '${trimmedCmd}'. Type 'help' for available commands.`;
    };

    const allCommands = [
        ...Object.keys(commandMap),
        ...Object.values(commandMap).flatMap(c => c.aliases || [])
    ];
    
    return {
        onExecute: execute,
        knownCommands: allCommands
    };
  }, []);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-4 text-cyan-400 drop-shadow-[0_2px_4px_rgba(34,211,238,0.3)]">Admin Console</h1>
      <AegisTerminal onExecute={onExecute} knownCommands={knownCommands} initialOutput={initialOutput}/>
    </div>
  );
};

export default AdminConsole;