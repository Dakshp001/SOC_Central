# backend/tool/mdm/security.py
# MDM security calculation utilities

def calculate_security_score(total_devices, compromised_count, no_pass_count, not_encrypted_count, non_compliant_count):
    """Calculate MDM security score"""
    if total_devices == 0:
        return 0.0
    
    # Base score starts at 100
    compliance_score = (total_devices - non_compliant_count) / total_devices * 60
    
    # Deduct points for security issues
    security_issues = compromised_count + no_pass_count + not_encrypted_count
    security_penalty = min((security_issues / total_devices) * 40, 40)
    
    # Final score
    final_score = max(0, compliance_score + 40 - security_penalty)
    
    return round(final_score, 2)