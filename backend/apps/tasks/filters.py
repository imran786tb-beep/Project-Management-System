import django_filters
from .models import Task

class TaskFilter(django_filters.FilterSet):
    workspace = django_filters.NumberFilter(field_name='project__workspace__id')
    project = django_filters.NumberFilter(field_name='project__id')
    column = django_filters.NumberFilter(field_name='column__id')
    priority = django_filters.CharFilter(field_name='priority')
    assignee = django_filters.NumberFilter(field_name='assignees__id')
    label = django_filters.NumberFilter(field_name='labels__id')
    is_archived = django_filters.BooleanFilter(field_name='is_archived')

    class Meta:
        model = Task
        fields = ['workspace', 'project', 'column', 'priority', 'assignee', 'label', 'is_archived']
