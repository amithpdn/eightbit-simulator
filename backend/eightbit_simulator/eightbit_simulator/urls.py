from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from simulator.views import InstructionSetViewSet, ExampleProgramViewSet, SimulatorSessionViewSet


router = DefaultRouter()
router.register(r'instruction-sets', InstructionSetViewSet)
router.register(r'example-programs', ExampleProgramViewSet)
router.register(r'sessions', SimulatorSessionViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]