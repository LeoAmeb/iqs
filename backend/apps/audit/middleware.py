import threading

_thread_locals = threading.local()


def get_current_request():
    """Return the current HTTP request stored in thread-local storage, or None."""
    return getattr(_thread_locals, "request", None)


class AuditMiddleware:
    """
    Middleware that stores the current request in thread-local storage so
    that signals and other non-view code can access it to record audit info
    (IP address, user agent, acting user).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.request = request
        try:
            response = self.get_response(request)
        finally:
            # Clean up to avoid memory leaks in long-running worker processes
            if hasattr(_thread_locals, "request"):
                del _thread_locals.request
        return response
