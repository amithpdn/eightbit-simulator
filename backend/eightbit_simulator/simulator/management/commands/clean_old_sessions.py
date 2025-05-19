import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from ...models import SimulatorSession  # Adjust the import path if necessary

class Command(BaseCommand):
    help = 'Deletes simulator sessions older than 10 days'

    def handle(self, *args, **options):
        # Calculate the date 10 days ago
        cutoff_date = timezone.now() - datetime.timedelta(days=10)
        
        # Delete sessions older than the cutoff date
        old_sessions = SimulatorSession.objects.filter(start_time__lt=cutoff_date)
        count = old_sessions.count()
        old_sessions.delete()
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {count} sessions older than {cutoff_date}')
        )

