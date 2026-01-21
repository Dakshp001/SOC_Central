// src/components/Dashboards/SIEM/constants.ts

import { SeverityMapType } from './types';

export const severityMap: SeverityMapType = {
  0: { name: "Info", color: "#6B7280", bgColor: "bg-gray-500" },
  1: { name: "Low", color: "#10B981", bgColor: "bg-green-500" },
  2: { name: "Medium", color: "#F59E0B", bgColor: "bg-yellow-500" },
  3: { name: "High", color: "#F87171", bgColor: "bg-red-400" },
  4: { name: "Critical", color: "#991B1B", bgColor: "bg-red-800" },
};

export const alertTitles = [
  "Suspicious Login Activity",
  "Malware Detection",
  "Unauthorized Access Attempt",
  "Policy Violation",
  "Network Anomaly",
  "Data Exfiltration Alert",
  "Privilege Escalation",
  "Brute Force Attack",
  "Phishing Attempt",
  "System Compromise",
];

export const sampleUsers = [
  "admin",
  "user1",
  "service_account",
  "analyst",
  "operator",
];