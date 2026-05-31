"""
Custom DRF exception handler — standardises all error responses to:

    {
        "status_code": 400,
        "detail": "Human-readable summary.",
        "errors": { "field": ["message"], ... }   # only present for validation errors
    }
"""
from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return None

    data = response.data
    payload: dict = {"status_code": response.status_code}

    if isinstance(exc, ValidationError):
        payload["detail"] = "Validation error."
        payload["errors"] = data if isinstance(data, dict) else {"non_field_errors": data}
    elif isinstance(data, dict) and "detail" in data:
        payload["detail"] = str(data["detail"])
    elif isinstance(data, list):
        payload["detail"] = str(data[0]) if data else "An error occurred."
    else:
        payload["detail"] = str(data)

    response.data = payload
    return response
