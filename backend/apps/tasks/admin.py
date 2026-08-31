from django.contrib import admin
from .models import Task, Subtask, Label, TaskDependency, Attachment

class SubtaskInline(admin.TabularInline):
    model = Subtask
    extra = 1

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('task_key', 'title', 'project', 'column', 'priority', 'due_date')
    search_fields = ('title', 'description')
    inlines = [SubtaskInline]

@admin.register(Label)
class LabelAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'color')
