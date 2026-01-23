# Generated migration to remove MFA fields

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0010_add_mfa_fields'),
    ]

    operations = [
        # Remove MFA fields from User model
        migrations.RemoveField(
            model_name='user',
            name='mfa_enabled',
        ),
        migrations.RemoveField(
            model_name='user',
            name='totp_secret',
        ),
        migrations.RemoveField(
            model_name='user',
            name='backup_codes',
        ),
        migrations.RemoveField(
            model_name='user',
            name='mfa_required',
        ),
        
        # Remove two_factor_enabled from UserSettings model
        migrations.RemoveField(
            model_name='usersettings',
            name='two_factor_enabled',
        ),
    ]