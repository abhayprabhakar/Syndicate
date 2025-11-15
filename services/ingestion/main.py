"""
FastAPI application entry point for the Ingestion Service.
"""
import json
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from config import get_settings
from api import endpoints
from services.orchestrator import IngestionOrchestrator
from repositories.database import DatabaseManager
from utils.logger import configure_logging, get_logger
from utils.exceptions import IngestionException
from models.schemas import HealthCheckResponse, ErrorResponse

# Configure logging
configure_logging()
logger = get_logger(__name__)

# Prometheus metrics - only register once
try:
    REQUEST_COUNT = Counter('ingestion_requests_total', 'Total ingestion requests', ['method', 'endpoint', 'status'])
    REQUEST_DURATION = Histogram('ingestion_request_duration_seconds', 'Request duration', ['method', 'endpoint'])
    FRAME_COUNT = Counter('ingestion_frames_total', 'Total frames ingested', ['camera_id', 'source_type'])
except ValueError:
    # Metrics already registered (e.g., during reload)
    from prometheus_client import REGISTRY
    REQUEST_COUNT = REGISTRY._names_to_collectors.get('ingestion_requests_total')
    REQUEST_DURATION = REGISTRY._names_to_collectors.get('ingestion_request_duration_seconds')
    FRAME_COUNT = REGISTRY._names_to_collectors.get('ingestion_frames_total')


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info("ingestion_service_starting", version=settings.api.version)
    
    # Initialize orchestrator
    orchestrator = IngestionOrchestrator()
    endpoints.orchestrator = orchestrator
    
    # Initialize database
    try:
        await orchestrator.db_manager.create_tables()
        logger.info("database_initialized")
    except Exception as e:
        logger.error("database_initialization_failed", error=str(e))
        raise
    
    logger.info("ingestion_service_started")
    
    yield
    
    # Shutdown
    logger.info("ingestion_service_shutting_down")
    
    # Cleanup orchestrator
    await orchestrator.cleanup()
    
    logger.info("ingestion_service_stopped")


# Load settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.api.title,
    version=settings.api.version,
    description=settings.api.description,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add CORS middleware (auto-handle wildcard + credentials conflict)
allowed_origins = settings.api.cors_origins or ["*"]
allow_credentials = settings.api.cors_credentials

if allow_credentials and "*" in allowed_origins:
    logger.warning(
        "cors_credentials_disabled_for_wildcard",
        allow_credentials=allow_credentials,
        allowed_origins=allowed_origins,
    )
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=settings.api.cors_methods,
    allow_headers=settings.api.cors_headers,
)


# Middleware for request logging and metrics
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests and collect metrics."""
    start_time = datetime.utcnow()
    
    # Log request
    logger.info(
        "http_request_started",
        method=request.method,
        path=request.url.path,
        client=request.client.host if request.client else None
    )
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = (datetime.utcnow() - start_time).total_seconds()
    
    # Log response
    logger.info(
        "http_request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration_seconds=duration
    )
    
    # Update metrics
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    logger.error("validation_error", path=request.url.path, errors=exc.errors())
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error="ValidationError",
            message="Request validation failed",
            details={"errors": exc.errors()}
        ).model_dump()
    )


@app.exception_handler(IngestionException)
async def ingestion_exception_handler(request: Request, exc: IngestionException):
    """Handle custom ingestion exceptions."""
    logger.error(
        "ingestion_exception",
        path=request.url.path,
        error_code=exc.error_code,
        message=exc.message
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error=exc.error_code,
            message=exc.message,
            details=exc.details
        ).model_dump()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(
        "unexpected_exception",
        path=request.url.path,
        error=str(exc),
        error_type=type(exc).__name__,
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="InternalServerError",
            message="An unexpected error occurred",
            details={"error_type": type(exc).__name__}
        ).model_dump()
    )


# Health check endpoint
@app.get(
    "/health",
    response_model=HealthCheckResponse,
    tags=["health"],
    summary="Health check",
    description="Check the health status of the ingestion service"
)
async def health_check():
    """Health check endpoint."""
    dependencies = {}
    
    # Check database
    try:
        db_manager = DatabaseManager()
        async with db_manager.get_session() as session:
            await session.execute(text("SELECT 1"))
        dependencies["database"] = "healthy"
        await db_manager.close()
    except Exception as e:
        logger.error("health_check_database_failed", error=str(e))
        dependencies["database"] = "unhealthy"
    
    # Check storage (simplified check)
    try:
        from services.storage_service import StorageService
        storage = StorageService()
        dependencies["storage"] = "healthy"
    except Exception as e:
        logger.error("health_check_storage_failed", error=str(e))
        dependencies["storage"] = "unhealthy"
    
    # Overall status
    overall_status = "healthy" if all(v == "healthy" for v in dependencies.values()) else "degraded"
    
    return HealthCheckResponse(
        status=overall_status,
        version=settings.api.version,
        dependencies=dependencies
    )


# Metrics endpoint
@app.get("/metrics", include_in_schema=False)
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


# Include API routers
app.include_router(endpoints.router)


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Root endpoint with service information."""
    return {
        "service": settings.api.title,
        "version": settings.api.version,
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.api.host,
        port=settings.api.port,
        reload=settings.debug,
        log_config=None  # We use structlog for logging
    )
