# backend/apps/users/views.py

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from .models import User
from .serializers import UserRegistrationSerializer, UserProfileSerializer, LoginSerializer


class RegisterView(generics.CreateAPIView):
    """Регистрация нового пользователя"""
    
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        # Отправляем приветственное письмо
        try:
            self.send_welcome_email(user)
        except Exception as e:
            # Логируем ошибку, но не ломаем регистрацию
            print(f"Failed to send welcome email: {e}")
        
        # Генерируем JWT токены
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    
    def send_welcome_email(self, user):
        """Отправляет приветственное письмо новому пользователю"""
        subject = 'Добро пожаловать в SiteKick!'
        html_message = render_to_string('emails/welcome.html', {
            'user': user,
            'trial_days': settings.TRIAL_PERIOD_DAYS
        })
        
        send_mail(
            subject=subject,
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """Вход в систему"""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    user = serializer.validated_data['user']
    refresh = RefreshToken.for_user(user)
    
    # Обновляем время последнего входа
    user.last_login_at = timezone.now()
    user.save(update_fields=['last_login_at'])
    
    return Response({
        'user': UserProfileSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    })


class ProfileView(generics.RetrieveUpdateAPIView):
    """Просмотр и редактирование профиля пользователя"""
    
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


# backend/apps/projects/views.py

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Project, Client, Expense, ProjectPayment
from .serializers import (
    ProjectSerializer, ProjectDetailSerializer, ClientSerializer,
    ExpenseSerializer, ProjectPaymentSerializer
)


class ProjectListCreateView(generics.ListCreateAPIView):
    """Список проектов и создание нового проекта"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Project.objects.filter(user=self.request.user)
        
        # Фильтрация по статусу
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Поиск по названию и адресу
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(address__icontains=search)
            )
        
        return queryset
    
    def get_serializer_class(self):
        return ProjectSerializer


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Детали проекта"""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectDetailSerializer
    
    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)


class ClientListCreateView(generics.ListCreateAPIView):
    """Список клиентов и создание нового клиента"""
    
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Client.objects.filter(user=self.request.user)
        
        # Поиск по имени
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset


class ExpenseListCreateView(generics.ListCreateAPIView):
    """Расходы по проекту"""
    
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        project_id = self.kwargs['project_id']
        project = get_object_or_404(Project, id=project_id, user=self.request.user)
        return Expense.objects.filter(project=project)
    
    def perform_create(self, serializer):
        project_id = self.kwargs['project_id']
        project = get_object_or_404(Project, id=project_id, user=self.request.user)
        serializer.save(project=project)


class ProjectPaymentListCreateView(generics.ListCreateAPIView):
    """Платежи от клиента по проекту"""
    
    serializer_class = ProjectPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        project_id = self.kwargs['project_id']
        project = get_object_or_404(Project, id=project_id, user=self.request.user)
        return ProjectPayment.objects.filter(project=project)
    
    def perform_create(self, serializer):
        project_id = self.kwargs['project_id']
        project = get_object_or_404(Project, id=project_id, user=self.request.user)
        serializer.save(project=project)


# backend/apps/quotes/views.py

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404, render
from django.db.models import Q
from django.http import Http404
from .models import Quote, QuoteItem, UserCatalogItem
from .serializers import (
    QuoteSerializer, QuoteCreateSerializer, QuoteItemSerializer,
    UserCatalogItemSerializer
)
from apps.projects.models import Project


class QuoteListCreateView(generics.ListCreateAPIView):
    """Сметы проекта"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        project_id = self.kwargs['project_id']
        project = get_object_or_404(Project, id=project_id, user=self.request.user)
        return Quote.objects.filter(project=project)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuoteCreateSerializer
        return QuoteSerializer


class QuoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Детали сметы"""
    
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuoteSerializer
    
    def get_queryset(self):
        return Quote.objects.filter(project__user=self.request.user)


class QuoteItemListCreateView(generics.ListCreateAPIView):
    """Позиции сметы"""
    
    serializer_class = QuoteItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        quote_id = self.kwargs['quote_id']
        quote = get_object_or_404(Quote, id=quote_id, project__user=self.request.user)
        return QuoteItem.objects.filter(quote=quote)
    
    def perform_create(self, serializer):
        quote_id = self.kwargs['quote_id']
        quote = get_object_or_404(Quote, id=quote_id, project__user=self.request.user)
        
        # Автоматически устанавливаем порядок
        last_order = QuoteItem.objects.filter(quote=quote).count()
        serializer.save(quote=quote, order=last_order + 1)


class QuoteItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Детали позиции сметы"""
    
    serializer_class = QuoteItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return QuoteItem.objects.filter(quote__project__user=self.request.user)


class UserCatalogView(generics.ListAPIView):
    """Персональный справочник пользователя"""
    
    serializer_class = UserCatalogItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = UserCatalogItem.objects.filter(user=self.request.user)
        
        # Поиск по названию
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        # Фильтрация по типу
        item_type = self.request.query_params.get('type')
        if item_type in ['work', 'material']:
            queryset = queryset.filter(type=item_type)
        
        return queryset


def public_quote_view(request, public_id):
    """Публичная страница сметы"""
    try:
        quote = Quote.objects.select_related('project', 'project__user', 'project__client').get(public_id=public_id)
    except Quote.DoesNotExist:
        raise Http404("Смета не найдена")
    
    context = {
        'quote': quote,
        'project': quote.project,
        'user': quote.project.user,
        'client': quote.project.client,
    }
    
    return render(request, 'quotes/public_quote.html', context)


# backend/sitekick/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/quotes/', include('apps.quotes.urls')),
    path('api/payments/', include('apps.payments.urls')),
]

# Статические файлы в разработке
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


# backend/apps/users/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
]


# backend/apps/projects/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProjectListCreateView.as_view(), name='project-list'),
    path('<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('clients/', views.ClientListCreateView.as_view(), name='client-list'),
    path('<int:project_id>/expenses/', views.ExpenseListCreateView.as_view(), name='expense-list'),
    path('<int:project_id>/payments/', views.ProjectPaymentListCreateView.as_view(), name='payment-list'),
]


# backend/apps/quotes/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('projects/<int:project_id>/quotes/', views.QuoteListCreateView.as_view(), name='quote-list'),
    path('<int:pk>/', views.QuoteDetailView.as_view(), name='quote-detail'),
    path('<int:quote_id>/items/', views.QuoteItemListCreateView.as_view(), name='quote-item-list'),
    path('items/<int:pk>/', views.QuoteItemDetailView.as_view(), name='quote-item-detail'),
    path('catalog/', views.UserCatalogView.as_view(), name='user-catalog'),
    path('public/<str:public_id>/', views.public_quote_view, name='public-quote'),
]
