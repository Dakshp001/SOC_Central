# backend/tool/migrations/0002_enhanced_data_persistence.py
# Generated migration for enhanced data persistence

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):
    dependencies = [
        ('tool', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Add new fields to SecurityDataUpload
        migrations.AddField(
            model_name='securitydataupload',
            name='uploaded_by',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='uploads',
                to=settings.AUTH_USER_MODEL,
                default=1  # You'll need to adjust this
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='securitydataupload',
            name='is_active',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='securitydataupload',
            name='activated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='securitydataupload',
            name='activated_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='activated_uploads',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='securitydataupload',
            name='company_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='securitydataupload',
            name='is_public_to_company',
            field=models.BooleanField(default=True),
        ),
        
        # Update status choices
        migrations.AlterField(
            model_name='securitydataupload',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('processing', 'Processing'),
                    ('completed', 'Completed'),
                    ('failed', 'Failed'),
                    ('active', 'Active'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
        
        # Create DataAccessLog model
        migrations.CreateModel(
            name='DataAccessLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('accessed_at', models.DateTimeField(auto_now_add=True)),
                ('access_type', models.CharField(
                    choices=[('view', 'View'), ('download', 'Download'), ('analyze', 'Analyze')],
                    max_length=20
                )),
                ('upload', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='access_logs',
                    to='tool.securitydataupload'
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'ordering': ['-accessed_at'],
            },
        ),
        
        # Create DataNotification model
        migrations.CreateModel(
            name='DataNotification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(
                    choices=[
                        ('data_uploaded', 'Data Uploaded'),
                        ('data_activated', 'Data Activated'),
                        ('data_updated', 'Data Updated'),
                        ('data_deleted', 'Data Deleted'),
                    ],
                    max_length=20
                )),
                ('title', models.CharField(max_length=255)),
                ('message', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('is_read', models.BooleanField(default=False)),
                ('recipient', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notifications',
                    to=settings.AUTH_USER_MODEL
                )),
                ('upload', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    to='tool.securitydataupload'
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        
        # Add unique constraint for active datasets
        migrations.AddConstraint(
            model_name='securitydataupload',
            constraint=models.UniqueConstraint(
                condition=models.Q(('is_active', True)),
                fields=('tool_type', 'company_name', 'is_active'),
                name='unique_active_tool_per_company',
            ),
        ),
    ]