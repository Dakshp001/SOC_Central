# backend/tool/edr/security.py
# EDR security calculation utilities

def calculate_security_score(total_endpoints, connected_endpoints, up_to_date_endpoints, 
                           total_threats, resolved_threats, malicious_threats):
    """
    Calculate EDR security score based on multiple factors
    
    Args:
        total_endpoints: Total number of endpoints
        connected_endpoints: Number of connected endpoints
        up_to_date_endpoints: Number of up-to-date endpoints
        total_threats: Total number of threats detected
        resolved_threats: Number of resolved threats
        malicious_threats: Number of malicious threats
    
    Returns:
        float: Security score between 0-100
    """
    if total_endpoints == 0:
        return 0.0
    
    # Component weights (total = 100%)
    ENDPOINT_AVAILABILITY_WEIGHT = 25  # 25%
    UPDATE_COMPLIANCE_WEIGHT = 25      # 25%
    THREAT_RESPONSE_WEIGHT = 30        # 30%
    THREAT_SEVERITY_WEIGHT = 20        # 20%
    
    # 1. Endpoint Availability Score (0-25 points)
    availability_rate = connected_endpoints / total_endpoints
    availability_score = availability_rate * ENDPOINT_AVAILABILITY_WEIGHT
    
    # 2. Update Compliance Score (0-25 points)
    compliance_rate = up_to_date_endpoints / total_endpoints
    compliance_score = compliance_rate * UPDATE_COMPLIANCE_WEIGHT
    
    # 3. Threat Response Score (0-30 points)
    if total_threats > 0:
        resolution_rate = resolved_threats / total_threats
        response_score = resolution_rate * THREAT_RESPONSE_WEIGHT
    else:
        # No threats is good - full points
        response_score = THREAT_RESPONSE_WEIGHT
    
    # 4. Threat Severity Score (0-20 points)
    if total_threats > 0:
        # Calculate severity penalty based on malicious threats
        malicious_rate = malicious_threats / total_threats
        # Higher malicious rate = lower score
        severity_score = (1 - malicious_rate) * THREAT_SEVERITY_WEIGHT
    else:
        # No threats is good - full points
        severity_score = THREAT_SEVERITY_WEIGHT
    
    # Calculate final score
    final_score = availability_score + compliance_score + response_score + severity_score
    
    # Apply additional penalties for critical issues
    final_score = apply_security_penalties(
        final_score, total_endpoints, connected_endpoints, 
        up_to_date_endpoints, total_threats, malicious_threats
    )
    
    # Ensure score is between 0 and 100
    final_score = max(0, min(100, final_score))
    
    return round(final_score, 2)


def apply_security_penalties(score, total_endpoints, connected_endpoints, 
                           up_to_date_endpoints, total_threats, malicious_threats):
    """
    Apply additional penalties for critical security issues
    
    Args:
        score: Current security score
        total_endpoints: Total number of endpoints
        connected_endpoints: Number of connected endpoints
        up_to_date_endpoints: Number of up-to-date endpoints
        total_threats: Total number of threats
        malicious_threats: Number of malicious threats
    
    Returns:
        float: Adjusted security score
    """
    if total_endpoints == 0:
        return score
    
    # Critical penalty thresholds
    CRITICAL_DISCONNECTION_THRESHOLD = 0.3  # 30% disconnected
    CRITICAL_OUTDATED_THRESHOLD = 0.4       # 40% outdated
    HIGH_MALICIOUS_THRESHOLD = 0.2          # 20% malicious threats
    
    # Calculate rates
    disconnection_rate = (total_endpoints - connected_endpoints) / total_endpoints
    outdated_rate = (total_endpoints - up_to_date_endpoints) / total_endpoints
    malicious_rate = malicious_threats / total_threats if total_threats > 0 else 0
    
    # Apply penalties
    penalty = 0
    
    # High disconnection penalty
    if disconnection_rate > CRITICAL_DISCONNECTION_THRESHOLD:
        penalty += 10 * (disconnection_rate - CRITICAL_DISCONNECTION_THRESHOLD) / (1 - CRITICAL_DISCONNECTION_THRESHOLD)
    
    # High outdated systems penalty
    if outdated_rate > CRITICAL_OUTDATED_THRESHOLD:
        penalty += 15 * (outdated_rate - CRITICAL_OUTDATED_THRESHOLD) / (1 - CRITICAL_OUTDATED_THRESHOLD)
    
    # High malicious threat rate penalty
    if malicious_rate > HIGH_MALICIOUS_THRESHOLD:
        penalty += 20 * (malicious_rate - HIGH_MALICIOUS_THRESHOLD) / (1 - HIGH_MALICIOUS_THRESHOLD)
    
    # Apply penalty cap (maximum 25 points penalty)
    penalty = min(penalty, 25)
    
    return score - penalty


def calculate_threat_risk_level(confidence_level, incident_status, analyst_verdict, policy_detection):
    """
    Calculate individual threat risk level
    
    Args:
        confidence_level: Threat confidence level (suspicious, malicious)
        incident_status: Current incident status (resolved, pending, etc.)
        analyst_verdict: Analyst verdict (false positive, suspicious, etc.)
        policy_detection: Policy at detection (detect, protect)
    
    Returns:
        str: Risk level (Critical, High, Medium, Low)
    """
    # Convert to lowercase for consistent comparison
    confidence = str(confidence_level).lower() if confidence_level else ""
    status = str(incident_status).lower() if incident_status else ""
    verdict = str(analyst_verdict).lower() if analyst_verdict else ""
    policy = str(policy_detection).lower() if policy_detection else ""
    
    # False positive = Low risk
    if "false positive" in verdict:
        return "Low"
    
    # Resolved threats have reduced risk
    is_resolved = "resolved" in status
    
    # Malicious threats
    if "malicious" in confidence:
        if is_resolved:
            return "Medium"
        else:
            return "Critical" if "protect" in policy else "High"
    
    # Suspicious threats
    if "suspicious" in confidence:
        if is_resolved:
            return "Low"
        else:
            return "Medium"
    
    # Default case
    return "Medium" if not is_resolved else "Low"


def get_security_recommendations(kpis):
    """
    Generate security recommendations based on KPIs
    
    Args:
        kpis: Dictionary containing EDR KPIs
    
    Returns:
        list: List of security recommendations
    """
    recommendations = []
    
    # Endpoint availability recommendations
    availability_rate = kpis.get("endpointAvailabilityRate", 0)
    if availability_rate < 90:
        recommendations.append({
            "priority": "High",
            "category": "Endpoint Management",
            "recommendation": "Improve endpoint connectivity - consider network troubleshooting and agent health checks",
            "metric": f"Current availability: {availability_rate}%"
        })
    
    # Update compliance recommendations
    compliance_rate = kpis.get("updateComplianceRate", 0)
    if compliance_rate < 85:
        recommendations.append({
            "priority": "High",
            "category": "Update Management", 
            "recommendation": "Implement automated update policies and endpoint maintenance schedules",
            "metric": f"Current compliance: {compliance_rate}%"
        })
    
    # Threat response recommendations
    resolution_rate = kpis.get("threatResolutionRate", 0)
    if resolution_rate < 80:
        recommendations.append({
            "priority": "Critical",
            "category": "Threat Response",
            "recommendation": "Improve threat response procedures and analyst training",
            "metric": f"Current resolution rate: {resolution_rate}%"
        })
    
    # Malicious threat recommendations
    malicious_threats = kpis.get("maliciousThreats", 0)
    total_threats = kpis.get("totalThreats", 0)
    if total_threats > 0 and (malicious_threats / total_threats) > 0.15:
        recommendations.append({
            "priority": "Critical",
            "category": "Threat Detection",
            "recommendation": "Review and strengthen preventive security controls",
            "metric": f"Malicious threats: {malicious_threats}/{total_threats}"
        })
    
    # Scan success recommendations
    scan_success_rate = kpis.get("scanSuccessRate", 0)
    if scan_success_rate < 95:
        recommendations.append({
            "priority": "Medium",
            "category": "Scan Operations",
            "recommendation": "Investigate and resolve scan failures",
            "metric": f"Current success rate: {scan_success_rate}%"
        })
    
    return recommendations