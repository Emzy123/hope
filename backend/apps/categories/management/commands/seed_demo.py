from decimal import Decimal
from django.core.management.base import BaseCommand
from accounts.models import User
from categories.models import Category
from workers.models import WorkerProfile


class Command(BaseCommand):
    help = "Seed demo users, categories, and approved worker profiles."

    def handle(self, *args, **options):
        services = [
            ("Plumbing", "plumbing", "Pipe repairs, bathroom fittings, and emergency leak fixes.", "wrench"),
            ("Electrical", "electrical", "House wiring, sockets, lighting, and generator support.", "zap"),
            ("Cleaning", "cleaning", "Home, office, and post-construction cleaning.", "sparkles"),
            ("Carpentry", "carpentry", "Furniture repairs, doors, cabinets, and fittings.", "hammer"),
        ]

        categories = {}
        for name, slug, description, icon in services:
            category = Category.objects(slug=slug).first()
            if category is None:
                category = Category(name=name, slug=slug, description=description, icon=icon).save()
            else:
                category.update(name=name, description=description, icon=icon, is_active=True)
                category.reload()
            categories[slug] = category

        users = [
            ("admin@demo.skillbridge.ng", "08000000000", "SkillBridge Admin", "admin"),
            ("adewale@demo.skillbridge.ng", "08011111111", "Adewale Plumbing Pro", "worker"),
            ("zainab@demo.skillbridge.ng", "08022222222", "Zainab Electricals", "worker"),
            ("chioma@demo.skillbridge.ng", "08033333333", "Chioma Okafor", "customer"),
            ("ibrahim@demo.skillbridge.ng", "08044444444", "Ibrahim Musa", "customer"),
        ]

        saved_users = {}
        for email, phone, full_name, role in users:
            user = User.objects(email=email).first()
            if user is None:
                user = User(email=email, phone=phone, full_name=full_name, role=role, is_verified=True)
            else:
                user.phone = phone
                user.full_name = full_name
                user.role = role
                user.is_verified = True
            if role == "admin":
                user.set_password("demoAdmin1")
            user.save()
            saved_users[phone] = user

        worker_specs = [
            ("08011111111", [categories["plumbing"]], "Experienced Lagos plumber for urgent and scheduled repairs.", "Lagos", Decimal("6500.00"), 4.8, 42),
            ("08022222222", [categories["electrical"]], "Certified electrician handling safe home and office installations.", "Abuja", Decimal("7500.00"), 4.6, 28),
        ]

        for phone, worker_categories, bio, city, hourly_rate, rating_avg, rating_count in worker_specs:
            profile = WorkerProfile.objects(user=saved_users[phone]).first()
            if profile is None:
                WorkerProfile(
                    user=saved_users[phone],
                    categories=worker_categories,
                    bio=bio,
                    city=city,
                    hourly_rate=hourly_rate,
                    rating_avg=rating_avg,
                    rating_count=rating_count,
                    is_available=True,
                    is_approved=True,
                ).save()
            else:
                profile.categories = worker_categories
                profile.bio = bio
                profile.city = city
                profile.hourly_rate = hourly_rate
                profile.rating_avg = rating_avg
                profile.rating_count = rating_count
                profile.is_available = True
                profile.is_approved = True
                profile.save()

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
