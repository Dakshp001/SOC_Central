# Generated migration to update session timeout from 1 minute to 5 minutes
from django.db import migrations

def update_session_timeout_to_5_minutes(apps, schema_editor):
    """Update all existing users' session timeout from 60 seconds to 300 seconds"""
    UserSettings = apps.get_model('authentication', 'UserSettings')
    
    # Update all users who have 60 seconds (1 minute) session timeout to 300 seconds (5 minutes)
    updated_count = UserSettings.objects.filter(session_timeout=60).update(session_timeout=300)
    print(f"Updated {updated_count} users' session timeout to 5 minutes (300 seconds)")
    
    # Also update custom session timeout for users who had 60 seconds as custom
    custom_updated_count = UserSettings.objects.filter(
        session_timeout=0,  # Custom setting
        custom_session_timeout=60
    ).update(custom_session_timeout=300)
    print(f"Updated {custom_updated_count} users' custom session timeout to 5 minutes (300 seconds)")

def reverse_update_session_timeout(apps, schema_editor):
    """Reverse the migration - change back to 60 seconds"""
    UserSettings = apps.get_model('authentication', 'UserSettings')
    
    # Revert session timeout back to 60 seconds
    reverted_count = UserSettings.objects.filter(session_timeout=300).update(session_timeout=60)
    print(f"Reverted {reverted_count} users' session timeout back to 1 minute (60 seconds)")
    
    # Revert custom session timeout
    custom_reverted_count = UserSettings.objects.filter(
        session_timeout=0,
        custom_session_timeout=300
    ).update(custom_session_timeout=60)
    print(f"Reverted {custom_reverted_count} users' custom session timeout back to 1 minute (60 seconds)")

class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0013_add_custom_session_timeout'),
    ]

    operations = [
        migrations.RunPython(
            update_session_timeout_to_5_minutes,
            reverse_update_session_timeout
        ),
    ]