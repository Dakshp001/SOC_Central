// Tool Configuration Utility
// Save as: src/pages/ToolsNav/toolConfig.ts

import { Mail, Smartphone, Shield, Activity, Wifi, ShieldCheck } from 'lucide-react';

export type ToolType = 'gsuite' | 'mdm' | 'siem' | 'edr' | 'meraki' | 'sonicwall' | 'general';

export interface Tool {
  id: ToolType;
  name: string;
  icon: any;
  color: string;
  description: string;
  uploadSupported: boolean;
  processes: string[];
}

export const toolsConfig: Tool[] = [
  {
    id: 'gsuite',
    name: 'GSuite Security',
    icon: Mail,
    color: 'bg-blue-500',
    description: 'Email security and phishing analysis',
    uploadSupported: true,
    processes: [
      'Email scanning and threat detection',
      'Phishing attempt analysis and blocking',
      'Suspicious email flagging and review',
      'Whitelist domain management',
      'Client investigation coordination',
      'Threat intelligence integration'
    ]
  },
  {
    id: 'mdm',
    name: 'MDM Analytics',
    icon: Smartphone,
    color: 'bg-green-500',
    description: 'Mobile device management insights',
    uploadSupported: true,
    processes: [
      'Device compliance monitoring',
      'Security policy enforcement',
      'Wipe-out tracking and management',
      'Platform distribution analysis',
      'Enrollment status monitoring',
      'Security score calculation'
    ]
  },
  {
    id: 'siem',
    name: 'SIEM Analytics',
    icon: Shield,
    color: 'bg-red-500',
    description: 'Security information and event management',
    uploadSupported: true,
    processes: [
      'Real-time event correlation',
      'Threat detection and alerting',
      'Security incident response',
      'Log analysis and monitoring',
      'Compliance reporting',
      'Threat intelligence feeds'
    ]
  },
  {
    id: 'edr',
    name: 'EDR Monitoring',
    icon: Activity,
    color: 'bg-orange-500',
    description: 'Endpoint detection and response',
    uploadSupported: true,
    processes: [
      'Endpoint threat detection',
      'Behavioral analysis',
      'Incident investigation',
      'Threat hunting',
      'Endpoint isolation',
      'Forensic analysis'
    ]
  },
  {
    id: 'meraki',
    name: 'Meraki Network',
    icon: Wifi,
    color: 'bg-purple-500',
    description: 'Network security and monitoring',
    uploadSupported: true,
    processes: [
      'Network traffic analysis',
      'Access point monitoring',
      'Bandwidth utilization tracking',
      'Application usage monitoring',
      'Network security policies',
      'Performance optimization'
    ]
  },
  {
    id: 'sonicwall',
    name: 'SonicWall Security',
    icon: ShieldCheck,
    color: 'bg-indigo-500',
    description: 'Firewall and intrusion prevention',
    uploadSupported: true,
    processes: [
      'Firewall rule management',
      'Intrusion prevention',
      'VPN monitoring',
      'Content filtering',
      'Application control',
      'Threat protection'
    ]
  }
];

export const getToolById = (id: ToolType): Tool | undefined => {
  return toolsConfig.find(tool => tool.id === id);
};