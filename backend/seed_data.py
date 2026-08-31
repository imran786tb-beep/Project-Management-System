import os
import sys
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.workspaces.models import Workspace, WorkspaceMember, WorkspaceRole
from apps.projects.models import Project, ProjectMember, BoardColumn, ProjectRole
from apps.tasks.models import Task, Subtask, Label, TaskPriority, Attachment
from apps.collaboration.models import Comment, ActivityLog
from apps.notifications.models import Notification, NotificationVerb

User = get_user_model()

def seed_database():
    print("[*] Starting database seeding...")

    # 1. Create Demo Users
    users_data = [
        {
            'email': 'admin@pulse.com',
            'username': 'admin',
            'first_name': 'Marcus',
            'last_name': 'Vance',
            'job_title': 'Principal Product Architect',
            'bio': 'Passionate about distributed systems and fluid UX designs.',
            'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        },
        {
            'email': 'sarah@pulse.com',
            'username': 'sarah_dev',
            'first_name': 'Sarah',
            'last_name': 'Jenkins',
            'job_title': 'Senior Frontend Specialist',
            'bio': 'Crafting pixel-perfect components and high-performance WebSockets state.',
            'avatar': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
        },
        {
            'email': 'alex@pulse.com',
            'username': 'alex_backend',
            'first_name': 'Alex',
            'last_name': 'Rivera',
            'job_title': 'Lead Backend Engineer',
            'bio': 'Django enthusiast, database query optimizer, and API designer.',
            'avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
        },
    ]

    created_users = []
    for u in users_data:
        user, created = User.objects.get_or_create(
            email=u['email'],
            defaults={
                'username': u['username'],
                'first_name': u['first_name'],
                'last_name': u['last_name'],
                'job_title': u['job_title'],
                'bio': u['bio'],
                'avatar': u['avatar'],
                'dark_mode': True
            }
        )
        if created:
            user.set_password('Password123!')
            user.save()
            print(f"  Created user: {user.email}")
        created_users.append(user)

    admin_user, sarah_user, alex_user = created_users

    # 2. Create Workspace
    workspace, _ = Workspace.objects.get_or_create(
        name="Acme Global Workspace",
        defaults={
            'slug': 'acme-global',
            'description': 'Enterprise cross-functional workspace for core engineering and platform delivery.',
            'owner': admin_user,
            'icon': 'Briefcase'
        }
    )
    print(f"  Workspace ready: {workspace.name}")

    # Add workspace members
    WorkspaceMember.objects.get_or_create(workspace=workspace, user=admin_user, defaults={'role': WorkspaceRole.OWNER})
    WorkspaceMember.objects.get_or_create(workspace=workspace, user=sarah_user, defaults={'role': WorkspaceRole.ADMIN})
    WorkspaceMember.objects.get_or_create(workspace=workspace, user=alex_user, defaults={'role': WorkspaceRole.MEMBER})

    # 3. Create Demo Projects
    projects_data = [
        {
            'name': 'Pulse Platform V2',
            'key': 'PULSE',
            'description': 'Next-generation real-time project management engine with collaborative canvas.',
            'color': '#6366F1',
            'icon': 'Kanban',
        },
        {
            'name': 'Cloud Infrastructure Modernization',
            'key': 'CLOUD',
            'description': 'Migration to kubernetes clusters, Redis cache layer, and ASGI WebSockets scaling.',
            'color': '#10B981',
            'icon': 'Server',
        }
    ]

    for p_data in projects_data:
        project, p_created = Project.objects.get_or_create(
            workspace=workspace,
            key=p_data['key'],
            defaults={
                'name': p_data['name'],
                'description': p_data['description'],
                'color': p_data['color'],
                'icon': p_data['icon'],
            }
        )
        if p_created:
            print(f"  Created project: {project.name}")
            # Add project members
            ProjectMember.objects.create(project=project, user=admin_user, role=ProjectRole.OWNER)
            ProjectMember.objects.create(project=project, user=sarah_user, role=ProjectRole.ADMIN)
            ProjectMember.objects.create(project=project, user=alex_user, role=ProjectRole.MEMBER)

            # Columns
            col_todo = BoardColumn.objects.create(project=project, name='To Do', color='#94A3B8', order=0, is_default=True)
            col_in_progress = BoardColumn.objects.create(project=project, name='In Progress', color='#3B82F6', order=1)
            col_review = BoardColumn.objects.create(project=project, name='In Review', color='#F59E0B', order=2)
            col_done = BoardColumn.objects.create(project=project, name='Completed', color='#10B981', order=3)

            # Labels
            label_frontend = Label.objects.create(project=project, name='Frontend', color='#3B82F6')
            label_backend = Label.objects.create(project=project, name='Backend', color='#8B5CF6')
            label_design = Label.objects.create(project=project, name='Design System', color='#EC4899')
            label_urgent = Label.objects.create(project=project, name='Security', color='#EF4444')

            # Populate Tasks for PULSE project
            if project.key == 'PULSE':
                t1 = Task.objects.create(
                    project=project,
                    column=col_in_progress,
                    title="Implement WebSocket real-time board updates",
                    description="Configure Django Channels ASGI consumers to handle drag-and-drop task movements and stream live activity updates across clients.",
                    priority=TaskPriority.URGENT,
                    start_date=date.today(),
                    due_date=date.today() + timedelta(days=3),
                    story_points=5,
                    order=0,
                    creator=admin_user,
                )
                t1.assignees.add(alex_user, sarah_user)
                t1.labels.add(label_backend, label_frontend)

                Subtask.objects.create(task=t1, title="Configure Daphne ASGI server routing", is_completed=True, assignee=alex_user)
                Subtask.objects.create(task=t1, title="Build React WebSocket reconnecting hook", is_completed=True, assignee=sarah_user)
                Subtask.objects.create(task=t1, title="Broadcast drag-and-drop payload to room subscribers", is_completed=False, assignee=alex_user)

                c1 = Comment.objects.create(
                    task=t1,
                    author=sarah_user,
                    content="WebSocket endpoint `/ws/projects/PULSE/` is working smoothly! Board state syncs under 15ms."
                )

                t2 = Task.objects.create(
                    project=project,
                    column=col_review,
                    title="Design glassmorphic SaaS dashboard & Dark Mode toggle",
                    description="Create reusable UI components in Tailwind CSS including card containers, modal drawers, and responsive header elements.",
                    priority=TaskPriority.HIGH,
                    start_date=date.today() - timedelta(days=2),
                    due_date=date.today() + timedelta(days=1),
                    story_points=3,
                    order=1,
                    creator=sarah_user,
                )
                t2.assignees.add(sarah_user)
                t2.labels.add(label_design, label_frontend)

                t3 = Task.objects.create(
                    project=project,
                    column=col_todo,
                    title="Add JWT Token Auto-refresh & Secure Session persistence",
                    description="Integrate djangorestframework-simplejwt token rotation with automatic token refresh on HTTP 401 response interceptor.",
                    priority=TaskPriority.HIGH,
                    start_date=date.today() + timedelta(days=1),
                    due_date=date.today() + timedelta(days=5),
                    story_points=2,
                    order=0,
                    creator=alex_user,
                )
                t3.assignees.add(alex_user)
                t3.labels.add(label_backend)

                t4 = Task.objects.create(
                    project=project,
                    column=col_done,
                    title="Setup PostgreSQL database schema & custom User model",
                    description="Define core models for Workspaces, Projects, BoardColumns, Tasks, Comments, and ActivityLogs with database indexes.",
                    priority=TaskPriority.MEDIUM,
                    start_date=date.today() - timedelta(days=5),
                    due_date=date.today() - timedelta(days=1),
                    story_points=8,
                    order=0,
                    creator=admin_user,
                )
                t4.assignees.add(admin_user, alex_user)
                t4.labels.add(label_backend)

                # Activity logs
                ActivityLog.objects.create(project=project, task=t1, user=alex_user, action_type='TASK_MOVED', description="Moved 'Implement WebSocket real-time board updates' to In Progress")
                ActivityLog.objects.create(project=project, task=t2, user=sarah_user, action_type='TASK_UPDATED', description="Updated task priority to HIGH")

                # Notifications
                Notification.objects.create(
                    recipient=sarah_user,
                    sender=admin_user,
                    verb=NotificationVerb.ASSIGNED,
                    target_type='TASK',
                    target_id=t1.id,
                    title="Assigned to task",
                    message="Marcus Vance assigned you to 'Implement WebSocket real-time board updates'."
                )
                Notification.objects.create(
                    recipient=sarah_user,
                    sender=alex_user,
                    verb=NotificationVerb.COMMENTED,
                    target_type='TASK',
                    target_id=t1.id,
                    title="New comment on PULSE-1",
                    message="Alex Rivera commented: 'API endpoints for task drag-and-drop are now ready for integration.'"
                )

    print("[+] Database seeding completed successfully!")

if __name__ == '__main__':
    seed_database()
