# Create: backend/authentication/management/commands/check_users.py

from django.core.management.base import BaseCommand
from authentication.models import User

class Command(BaseCommand):
    help = 'Check users in the database'

    def handle(self, *args, **options):
        self.stdout.write("🔍 Checking users in database...")
        
        try:
            users = User.objects.all()
            self.stdout.write(f"📊 Total users: {users.count()}")
            
            for user in users:
                self.stdout.write(
                    f"👤 {user.email} | Role: {user.role} | Verified: {user.is_email_verified} | Active: {user.is_active}"
                )
            
            # Check for super admin specifically
            super_admin = User.objects.filter(email='csu.aiml@gmail.com').first()
            if super_admin:
                self.stdout.write(f"✅ Super admin found: {super_admin.email}")
                self.stdout.write(f"   Role: {super_admin.role}")
                self.stdout.write(f"   Verified: {super_admin.is_email_verified}")
                self.stdout.write(f"   Active: {super_admin.is_active}")
            else:
                self.stdout.write("❌ Super admin not found!")
                
        except Exception as e:
            self.stdout.write(f"❌ Error: {e}")
            
        self.stdout.write("✅ User check complete")