from django.db import models
from django.conf import settings

class NotificationVerb(models.TextChoices):
    ASSIGNED = 'ASSIGNED', 'Assigned'
    MENTIONED = 'MENTIONED', 'Mentioned'
    COMMENTED = 'COMMENTED', 'Commented'
    DUE_SOON = 'DUE_SOON', 'Due Soon'
    INVITED = 'INVITED', 'Invited'
    STATUS_CHANGED = 'STATUS_CHANGED', 'Status Changed'

class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications')
    verb = models.CharField(max_length=30, choices=NotificationVerb.choices, default=NotificationVerb.ASSIGNED)
    target_type = models.CharField(max_length=30, default='TASK') # TASK, PROJECT, WORKSPACE
    target_id = models.PositiveIntegerField(null=True, blank=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.recipient.email}: {self.title}"
