# backend/apps/projects/models.py

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid


class Client(models.Model):
    """Модель клиента"""
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='clients')
    name = models.CharField('Имя клиента', max_length=255)
    phone = models.CharField('Телефон', max_length=50, blank=True)
    email = models.EmailField('Email', blank=True)
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Клиент'
        verbose_name_plural = 'Клиенты'
        unique_together = ['user', 'name']  # Уникальные имена клиентов у пользователя
        
    def __str__(self):
        return f"{self.name} ({self.user.email})"


class Project(models.Model):
    """Модель проекта/объекта"""
    
    STATUS_CHOICES = [
        ('active', 'В работе'),
        ('completed', 'Завершен'),
        ('archived', 'Архивный'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    title = models.CharField('Название проекта', max_length=255)
    address = models.TextField('Адрес', blank=True)
    status = models.CharField('Статус', max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField('Заметки', blank=True)
    
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлен', auto_now=True)
    
    class Meta:
        verbose_name = 'Проект'
        verbose_name_plural = 'Проекты'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    @property
    def total_quote_amount(self):
        """Общая сумма всех смет по проекту"""
        return self.quotes.aggregate(
            total=models.Sum('total_amount')
        )['total'] or Decimal('0.00')
    
    @property
    def total_expenses(self):
        """Общая сумма расходов по проекту"""
        return self.expenses.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
    
    @property
    def total_payments_received(self):
        """Общая сумма полученных платежей"""
        return self.payments_received.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')
    
    @property
    def expected_profit(self):
        """Ожидаемая прибыль (сметы - расходы)"""
        return self.total_quote_amount - self.total_expenses
    
    @property
    def balance_due(self):
        """Остаток к доплате от клиента"""
        return self.total_quote_amount - self.total_payments_received


class Expense(models.Model):
    """Модель расходов по проекту"""
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='expenses')
    amount = models.DecimalField('Сумма', max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    description = models.TextField('Описание', blank=True)
    receipt_photo = models.ImageField('Фото чека', upload_to='receipts/%Y/%m/', blank=True, null=True)
    expense_date = models.DateField('Дата расхода')
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Расход'
        verbose_name_plural = 'Расходы'
        ordering = ['-expense_date', '-created_at']
        
    def __str__(self):
        return f"{self.project.title} - {self.amount} руб."


class ProjectPayment(models.Model):
    """Модель платежей от клиента по проекту"""
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='payments_received')
    amount = models.DecimalField('Сумма', max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    description = models.CharField('Описание', max_length=255, blank=True)
    payment_date = models.DateField('Дата платежа')
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Платеж от клиента'
        verbose_name_plural = 'Платежи от клиентов'
        ordering = ['-payment_date', '-created_at']
        
    def __str__(self):
        return f"{self.project.title} - получено {self.amount} руб."


# backend/apps/quotes/models.py

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid
import string
import random


def generate_public_id():
    """Генерирует уникальный публичный ID для сметы"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=10))


class Quote(models.Model):
    """Модель сметы"""
    
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='quotes')
    title = models.CharField('Название сметы', max_length=255)
    public_id = models.CharField('Публичный ID', max_length=50, unique=True, default=generate_public_id)
    notes = models.TextField('Примечания', blank=True)
    
    # Рассчитывается автоматически при сохранении позиций
    total_amount = models.DecimalField('Общая сумма', max_digits=12, decimal_places=2, default=0)
    work_amount = models.DecimalField('Сумма работ', max_digits=12, decimal_places=2, default=0)
    material_amount = models.DecimalField('Сумма материалов', max_digits=12, decimal_places=2, default=0)
    
    created_at = models.DateTimeField('Создана', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлена', auto_now=True)
    
    class Meta:
        verbose_name = 'Смета'
        verbose_name_plural = 'Сметы'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} - {self.project.title}"
    
    def save(self, *args, **kwargs):
        # Обеспечиваем уникальность public_id
        while Quote.objects.filter(public_id=self.public_id).exclude(pk=self.pk).exists():
            self.public_id = generate_public_id()
        super().save(*args, **kwargs)
    
    def calculate_totals(self):
        """Пересчитывает общие суммы сметы"""
        items = self.items.all()
        
        work_total = sum(item.total_price for item in items if item.type == 'work')
        material_total = sum(item.total_price for item in items if item.type == 'material')
        
        self.work_amount = Decimal(str(work_total))
        self.material_amount = Decimal(str(material_total))
        self.total_amount = self.work_amount + self.material_amount
        
        self.save(update_fields=['work_amount', 'material_amount', 'total_amount'])


class QuoteItem(models.Model):
    """Модель позиции в смете"""
    
    TYPE_CHOICES = [
        ('work', 'Работа'),
        ('material', 'Материал'),
    ]
    
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='items')
    name = models.CharField('Наименование', max_length=255)
    type = models.CharField('Тип', max_length=20, choices=TYPE_CHOICES)
    unit = models.CharField('Единица измерения', max_length=50)
    quantity = models.DecimalField('Количество', max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    unit_price = models.DecimalField('Цена за единицу', max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total_price = models.DecimalField('Общая стоимость', max_digits=12, decimal_places=2, default=0)
    
    # Порядок позиций в смете
    order = models.PositiveIntegerField('Порядок', default=0)
    
    created_at = models.DateTimeField('Создана', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Позиция сметы'
        verbose_name_plural = 'Позиции смет'
        ordering = ['order', 'created_at']
        
    def __str__(self):
        return f"{self.name} - {self.quantity} {self.unit}"
    
    def save(self, *args, **kwargs):
        # Автоматически рассчитываем общую стоимость
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        
        # Обновляем суммы в смете
        self.quote.calculate_totals()
    
    def delete(self, *args, **kwargs):
        quote = self.quote
        super().delete(*args, **kwargs)
        # Обновляем суммы в смете после удаления позиции
        quote.calculate_totals()


class UserCatalogItem(models.Model):
    """Модель персонального справочника пользователя"""
    
    TYPE_CHOICES = [
        ('work', 'Работа'),
        ('material', 'Материал'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='catalog_items')
    name = models.CharField('Наименование', max_length=255)
    type = models.CharField('Тип', max_length=20, choices=TYPE_CHOICES)
    unit = models.CharField('Единица измерения', max_length=50)
    default_price = models.DecimalField('Стандартная цена', max_digits=10, decimal_places=2, null=True, blank=True)
    usage_count = models.PositiveIntegerField('Количество использований', default=1)
    
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    last_used_at = models.DateTimeField('Последнее использование', auto_now=True)
    
    class Meta:
        verbose_name = 'Элемент справочника'
        verbose_name_plural = 'Элементы справочника'
        unique_together = ['user', 'name', 'type']  # Избегаем дублей
        ordering = ['-usage_count', '-last_used_at']
        
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
    
    def increment_usage(self):
        """Увеличивает счетчик использования"""
        self.usage_count += 1
        self.save(update_fields=['usage_count', 'last_used_at'])


# backend/apps/quotes/serializers.py

from rest_framework import serializers
from decimal import Decimal
from .models import Quote, QuoteItem, UserCatalogItem
from apps.projects.models import Project


class QuoteItemSerializer(serializers.ModelSerializer):
    """Сериализатор для позиций сметы"""
    
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = QuoteItem
        fields = [
            'id', 'name', 'type', 'unit', 'quantity', 'unit_price', 
            'total_price', 'order', 'created_at'
        ]
    
    def create(self, validated_data):
        # Добавляем позицию в персональный справочник пользователя
        quote = validated_data['quote']
        user = quote.project.user
        
        catalog_item, created = UserCatalogItem.objects.get_or_create(
            user=user,
            name=validated_data['name'],
            type=validated_data['type'],
            defaults={
                'unit': validated_data['unit'],
                'default_price': validated_data['unit_price'],
            }
        )
        
        if not created:
            # Обновляем существующий элемент справочника
            catalog_item.unit = validated_data['unit']
            catalog_item.default_price = validated_data['unit_price']
            catalog_item.increment_usage()
        
        return super().create(validated_data)


class QuoteSerializer(serializers.ModelSerializer):
    """Сериализатор для смет"""
    
    items = QuoteItemSerializer(many=True, read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    client_name = serializers.CharField(source='project.client.name', read_only=True)
    
    class Meta:
        model = Quote
        fields = [
            'id', 'title', 'public_id', 'notes', 'total_amount', 
            'work_amount', 'material_amount', 'items', 'project_title', 
            'client_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['public_id', 'total_amount', 'work_amount', 'material_amount']


class QuoteCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания сметы"""
    
    project_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Quote
        fields = ['title', 'notes', 'project_id']
    
    def validate_project_id(self, value):
        user = self.context['request'].user
        try:
            project = Project.objects.get(id=value, user=user)
        except Project.DoesNotExist:
            raise serializers.ValidationError("Проект не найден")
        return value
    
    def create(self, validated_data):
        project_id = validated_data.pop('project_id')
        project = Project.objects.get(id=project_id, user=self.context['request'].user)
        validated_data['project'] = project
        return super().create(validated_data)


class UserCatalogItemSerializer(serializers.ModelSerializer):
    """Сериализатор для элементов справочника пользователя"""
    
    class Meta:
        model = UserCatalogItem
        fields = [
            'id', 'name', 'type', 'unit', 'default_price', 
            'usage_count', 'last_used_at'
        ]
        read_only_fields = ['usage_count', 'last_used_at']


# backend/apps/projects/serializers.py

from rest_framework import serializers
from .models import Project, Client, Expense, ProjectPayment
from apps.quotes.serializers import QuoteSerializer


class ClientSerializer(serializers.ModelSerializer):
    """Сериализатор для клиентов"""
    
    class Meta:
        model = Client
        fields = ['id', 'name', 'phone', 'email', 'created_at']
        
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ExpenseSerializer(serializers.ModelSerializer):
    """Сериализатор для расходов"""
    
    class Meta:
        model = Expense
        fields = [
            'id', 'amount', 'description', 'receipt_photo', 
            'expense_date', 'created_at'
        ]


class ProjectPaymentSerializer(serializers.ModelSerializer):
    """Сериализатор для платежей от клиента"""
    
    class Meta:
        model = ProjectPayment
        fields = [
            'id', 'amount', 'description', 'payment_date', 'created_at'
        ]


class ProjectSerializer(serializers.ModelSerializer):
    """Сериализатор для проектов"""
    
    client = ClientSerializer(read_only=True)
    client_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    # Финансовые показатели
    total_quote_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_payments_received = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    expected_profit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    balance_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'address', 'status', 'notes', 'client', 'client_id',
            'total_quote_amount', 'total_expenses', 'total_payments_received',
            'expected_profit', 'balance_due', 'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate_client_id(self, value):
        if value is not None:
            user = self.context['request'].user
            if not Client.objects.filter(id=value, user=user).exists():
                raise serializers.ValidationError("Клиент не найден")
        return value


class ProjectDetailSerializer(ProjectSerializer):
    """Детальный сериализатор проекта с вложенными данными"""
    
    quotes = QuoteSerializer(many=True, read_only=True)
    expenses = ExpenseSerializer(many=True, read_only=True)
    payments_received = ProjectPaymentSerializer(many=True, read_only=True)
    
    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ['quotes', 'expenses', 'payments_received']
