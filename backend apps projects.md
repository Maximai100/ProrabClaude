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
        # Об
