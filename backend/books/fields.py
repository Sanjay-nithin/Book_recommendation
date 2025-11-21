"""
Custom fields for Djongo compatibility.
"""
import json
from django.db import models
from django.core.exceptions import ValidationError


class DjongoJSONField(models.JSONField):
    """
    JSONField that works with both Djongo (which stores native Python objects)
    and standard backends (which store JSON strings).
    
    Djongo stores lists/dicts directly in MongoDB, so from_db_value receives
    a Python object, not a string. This field handles both cases.
    """
    
    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        
        # If already a Python object (Djongo case), return as-is
        if isinstance(value, (list, dict)):
            return value
        
        # If a string (standard SQL backend), parse it
        if isinstance(value, str):
            try:
                return json.loads(value, cls=self.decoder)
            except (json.JSONDecodeError, TypeError) as e:
                raise ValidationError(f"Invalid JSON: {e}")
        
        # Fallback: return as-is (handles bytes, int, etc.)
        return value
    
    def get_prep_value(self, value):
        """
        Convert Python object to database-ready format.
        For Djongo, we can store native Python; for SQL, convert to JSON string.
        """
        if value is None:
            return value
        
        # Djongo accepts native Python objects; standard backends need JSON string
        # We let Django's base JSONField handle the conversion based on backend
        return super().get_prep_value(value)
