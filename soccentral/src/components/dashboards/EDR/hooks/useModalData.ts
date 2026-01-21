import { EDRData, ModalData } from '../types';

export const useModalData = (data: EDRData) => {
  const getEndpointsModalData = (): ModalData => {
    // Debug: Check if we have endpoint names
    if (data.details.endpoints && data.details.endpoints.length > 0) {
      const firstEndpoint = data.details.endpoints[0];
      console.log("🔍 First endpoint fields:", Object.keys(firstEndpoint));
      console.log("🔍 First endpoint data:", firstEndpoint);
      console.log("🔍 Checking name fields:", {
        name: firstEndpoint.name,
        endpoint: firstEndpoint.endpoint,
        'Endpoint Name': firstEndpoint['Endpoint Name'],
        'Device Name': firstEndpoint['Device Name'],
        'Computer Name': firstEndpoint['Computer Name'],
        hostname: firstEndpoint.hostname,
        'Host Name': firstEndpoint['Host Name'],
        'Machine Name': firstEndpoint['Machine Name'],
        agent_uuid: firstEndpoint.agent_uuid,
        Agent_UUID: firstEndpoint.Agent_UUID
      });

      // Log all available endpoints data for debugging
      console.log("🔍 All endpoints sample (first 3):", data.details.endpoints.slice(0, 3).map(ep => ({
        allFields: Object.keys(ep),
        nameField: ep.name,
        endpointField: ep.endpoint,
        endpointNameField: ep['Endpoint Name'],
        deviceNameField: ep['Device Name'],
        computerNameField: ep['Computer Name'],
        hostnameField: ep.hostname,
        hostNameField: ep['Host Name'],
        machineNameField: ep['Machine Name'],
        agentUuidField: ep.agent_uuid,
        agentUUIDField: ep.Agent_UUID
      })));
    }

    return {
      title: "All Endpoints Details",
      data: data.details.endpoints,
      columns: ["Name", "OS", "Network Status", "Update Status", "Last User", "Serial Number"],
      type: "endpoints",
    };
  };

  const getConnectedEndpointsData = (): ModalData => ({
    title: "Connected Endpoints",
    data: data.details.endpoints.filter(
      (ep) => ep.network_status.toLowerCase() === "connected"
    ),
    columns: ["Name", "OS", "Network Status", "Update Status", "Last User"],
    type: "endpoints",
  });

  const getDisconnectedEndpointsData = (): ModalData => ({
    title: "Disconnected Endpoints",
    data: data.details.endpoints.filter(
      (ep) => ep.network_status.toLowerCase() === "disconnected"
    ),
    columns: ["Name", "OS", "Network Status", "Last User", "Serial Number"],
    type: "endpoints",
  });

  const getAllThreatsData = (): ModalData => ({
    title: "All Incidents",
    data: data.details.threats,
    columns: ["Threat Details", "Confidence Level", "Endpoints", "Classification"],
    type: "threats",
  });

  const getMaliciousThreatsData = (): ModalData => ({
    title: "Malicious Threats",
    data: data.details.threats.filter(
      (threat) => threat.confidence_level?.toLowerCase() === "malicious"
    ),
    columns: ["Threat Details", "Confidence Level", "Endpoints", "Classification"],
    type: "threats",
  });

  const getSuspiciousThreatsData = (): ModalData => ({
    title: "Suspicious Threats",
    data: data.details.threats.filter(
      (threat) => threat.confidence_level?.toLowerCase() === "suspicious"
    ),
    columns: ["Threat Details", "Confidence Level", "Endpoints", "Classification"],
    type: "threats",
  });

  const getUpToDateEndpointsData = (): ModalData => ({
    title: "Up-to-Date Endpoints",
    data: data.details.endpoints.filter((ep) =>
      ep.scan_status.toLowerCase().includes("up to date")
    ),
    columns: ["Name", "OS", "Scan Status", "Network Status", "Last User"],
    type: "endpoints",
  });

  return {
    getEndpointsModalData,
    getConnectedEndpointsData,
    getDisconnectedEndpointsData,
    getAllThreatsData,
    getMaliciousThreatsData,
    getSuspiciousThreatsData,
    getUpToDateEndpointsData,
  };
};
