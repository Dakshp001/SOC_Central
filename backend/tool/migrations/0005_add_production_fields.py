# Generated migration for production stability features

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tool', '0004_dataaccesslog_data_company_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='securitydataupload',
            name='file_hash',
            field=models.CharField(blank=True, db_index=True, max_length=64),
        ),
        migrations.AddField(
            model_name='securitydataupload',
            name='record_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddIndex(
            model_name='securitydataupload',
            index=models.Index(fields=['file_hash', 'company_name', 'tool_type'], name='tool_securitydataupload_hash_company_tool_idx'),
        ),
        migrations.AddIndex(
            model_name='securitydataupload',
            index=models.Index(fields=['company_name', 'is_active', 'tool_type'], name='tool_securitydataupload_company_active_tool_idx'),
        ),
    ]