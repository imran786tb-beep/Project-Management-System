from django.contrib import admin
from .models import Workspace, WorkspaceMember, WorkspaceInvitation

class WorkspaceMemberInline(admin.TabularInline):
    model = WorkspaceMember
    extra = 1

@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'owner', 'created_at')
    inlines = [WorkspaceMemberInline]

@admin.register(WorkspaceInvitation)
class WorkspaceInvitationAdmin(admin.ModelAdmin):
    list_display = ('workspace', 'email', 'role', 'status', 'invited_by', 'created_at')
