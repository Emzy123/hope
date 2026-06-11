"""
Management command: create_admin
Usage: python manage.py create_admin --email admin@skillbridge.ng --name "Admin Name" --password yourpassword [--phone 08012345678]
"""
from django.core.management.base import BaseCommand, CommandError
from accounts.models import User


class Command(BaseCommand):
    help = "Create a new admin user account with password-based login."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Admin email address e.g. admin@skillbridge.ng")
        parser.add_argument("--phone", help="Optional Nigerian phone number e.g. 08012345678")
        parser.add_argument("--name", required=True, help="Full name of the admin")
        parser.add_argument("--password", required=True, help="Secure password for the admin account")

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        phone = (options.get("phone") or "").strip()
        name = options["name"].strip()
        password = options["password"].strip()

        if len(password) < 8:
            raise CommandError("Password must be at least 8 characters long.")

        existing = User.objects(email=email).first()
        if existing:
            if existing.role != "admin":
                raise CommandError(
                    f"A non-admin user already exists with email {email} (role: {existing.role}). "
                    "Cannot promote via this command — handle manually."
                )
            existing.full_name = name
            if phone:
                existing.phone = phone
            existing.set_password(password)
            existing.is_active = True
            existing.is_verified = True
            existing.save()
            self.stdout.write(self.style.SUCCESS(f"✅ Admin account updated for {email}"))
        else:
            user = User(email=email, phone=phone or None, full_name=name, role="admin", is_active=True, is_verified=True)
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"✅ Admin account created: {name} ({email})"))
