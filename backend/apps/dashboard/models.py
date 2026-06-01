from django.db import models


class Dashboard(models.Model):
    class Meta:
        managed = False
        default_permissions = ()
        permissions = [("view_dashboard", "Ver dashboard")]
