# Generated manually for MFA enhancement

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0009_usersettings_useractivitylog'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='country_code',
            field=models.CharField(blank=True, default='', help_text='Country code (e.g., +1, +44)', max_length=5),
        ),
        migrations.AddField(
            model_name='user',
            name='is_phone_verified',
            field=models.BooleanField(default=False, help_text='Phone number verification status'),
        ),
        migrations.AddField(
            model_name='user',
            name='mfa_enabled',
            field=models.BooleanField(default=False, help_text='Multi-factor authentication enabled'),
        ),
        migrations.AddField(
            model_name='user',
            name='totp_secret',
            field=models.CharField(blank=True, help_text='TOTP secret key for authenticator apps', max_length=32),
        ),
        migrations.AddField(
            model_name='user',
            name='backup_codes',
            field=models.JSONField(blank=True, default=list, help_text='Emergency backup codes'),
        ),
        migrations.AddField(
            model_name='user',
            name='mfa_required',
            field=models.BooleanField(default=False, help_text='MFA required for this user'),
        ),
        migrations.AlterField(
            model_name='user',
            name='phone_number',
            field=models.CharField(blank=True, default='', help_text='Contact phone number with country code', max_length=20),
        ),
        migrations.AddField(
            model_name='otpverification',
            name='delivery_method',
            field=models.CharField(choices=[('email', 'Email'), ('sms', 'SMS')], default='email', max_length=10),
        ),
        migrations.AddField(
            model_name='otpverification',
            name='phone_number',
            field=models.CharField(blank=True, help_text='Phone number for SMS delivery', max_length=20),
        ),
        migrations.AlterField(
            model_name='otpverification',
            name='purpose',
            field=models.CharField(choices=[('signup', 'Signup Verification'), ('login', 'Login Verification'), ('password_reset', 'Password Reset'), ('email_change', 'Email Change'), ('mfa_login', 'MFA Login Verification'), ('phone_verification', 'Phone Number Verification'), ('mfa_setup', 'MFA Setup Verification')], max_length=20),
        ),
    ]