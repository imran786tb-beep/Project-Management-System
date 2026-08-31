from django.contrib import admin
from .models import Project, ProjectMember, BoardColumn

class BoardColumnInline(admin.TabularInline):
    model = BoardColumn
    extra = 1

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'key', 'workspace', 'is_archived', 'created_at')
    inlines = [BoardColumnInline]

@admin.register(BoardColumn)
class BoardColumnAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'order', 'color')
