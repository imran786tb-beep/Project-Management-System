from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

from django.db.models import Q

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        username_field = getattr(User, 'USERNAME_FIELD', 'email')
        self.fields[username_field] = serializers.CharField(required=False)
        self.fields['username'] = serializers.CharField(required=False, allow_blank=True)
        self.fields['email'] = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        username_field = getattr(User, 'USERNAME_FIELD', 'email')
        login_input = (
            self.initial_data.get('email') or 
            self.initial_data.get('username') or 
            attrs.get('email') or 
            attrs.get('username') or 
            attrs.get(username_field)
        )
        password = attrs.get('password') or self.initial_data.get('password')

        if not login_input or not password:
            raise serializers.ValidationError({"detail": "Both email/username and password are required."})

        clean_input = str(login_input).strip().lower()
        user = User.objects.filter(Q(email__iexact=clean_input) | Q(username__iexact=clean_input)).first()

        if not user:
            raise serializers.ValidationError({"detail": "No account found with this email address or username."})

        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "Invalid credentials. Password does not match."})

        if not user.is_active:
            raise serializers.ValidationError({"detail": "User account is disabled."})

        self.user = user
        refresh = self.get_token(user)


        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.full_name,
                'avatar': user.avatar,
                'job_title': user.job_title,
                'dark_mode': user.dark_mode,
            }
        }
        return data



class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'avatar', 'job_title', 'bio', 'dark_mode', 'created_at'
        )
        read_only_fields = ('id', 'email', 'created_at')

class UserMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'full_name', 'avatar', 'job_title')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'confirm_password', 'job_title')

    def validate(self, attrs):
        if 'email' in attrs and isinstance(attrs['email'], str):
            attrs['email'] = attrs['email'].strip().lower()
        if 'username' in attrs and isinstance(attrs['username'], str):
            attrs['username'] = attrs['username'].strip().lower()
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            job_title=validated_data.get('job_title', '')
        )
        # Create dedicated personal workspace for new user
        try:
            from apps.workspaces.models import Workspace, WorkspaceMember, WorkspaceRole
            display_name = user.first_name or user.username
            ws_name = f"{display_name}'s Workspace"
            ws_slug = f"ws-{user.username.replace('@', '-').replace('.', '-')}-{user.id}".lower()
            ws = Workspace.objects.create(name=ws_name, slug=ws_slug, owner=user)
            WorkspaceMember.objects.create(workspace=ws, user=user, role=WorkspaceRole.OWNER)
        except Exception as e:
            print("Workspace creation error:", e)

        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
