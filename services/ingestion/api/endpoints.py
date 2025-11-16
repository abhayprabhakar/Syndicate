"""
FastAPI REST API endpoints for the ingestion service.
"""
from typing import List
from uuid import UUID
from pathlib import Path
from io import BytesIO

from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Depends, status
from fastapi.responses import JSONResponse, StreamingResponse

from models.schemas import (
    RTSPIngestionRequest, UploadIngestionRequest,
    IngestionResponse, ErrorResponse, FrameMetadata
)
from services.orchestrator import IngestionOrchestrator
from services.pdf_generator import generate_pdf_report
from services.gemini_analyzer import analyze_with_gemini
from services.graph_generator import generate_graphs
from utils.logger import get_logger
from utils.exceptions import (
    IngestionException, ValidationError, RTSPConnectionError,
    StorageError, DatabaseError
)

logger = get_logger(__name__)
router = APIRouter(prefix="/api/v1/ingest", tags=["ingestion"])

# Global orchestrator instance (will be initialized in main.py)
orchestrator: IngestionOrchestrator = None


def get_orchestrator() -> IngestionOrchestrator:
    """Dependency to get orchestrator instance."""
    if orchestrator is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ingestion service not initialized"
        )
    return orchestrator


@router.post(
    "/rtsp",
    response_model=IngestionResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Ingest from RTSP stream",
    description="Capture frames from an RTSP camera stream",
    responses={
        202: {"description": "Ingestion request accepted and processing"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        503: {"model": ErrorResponse, "description": "Service unavailable"},
    }
)
async def ingest_rtsp(
    request: RTSPIngestionRequest,
    orch: IngestionOrchestrator = Depends(get_orchestrator)
):
    """
    Ingest frames from RTSP stream.
    
    - **rtsp_url**: RTSP stream URL (e.g., rtsp://user:pass@camera:554/stream)
    - **camera_id**: Unique camera identifier
    - **capture_mode**: single_frame, continuous, or event_driven
    - **frame_timestamp**: Optional specific timestamp to capture (for single_frame)
    - **capture_duration**: Duration in seconds for continuous capture
    - **fps**: Frames per second to capture
    - **meta**: Additional metadata
    """
    try:
        logger.info(
            "rtsp_ingestion_request_received",
            camera_id=request.camera_id,
            capture_mode=request.capture_mode.value
        )
        
        response = await orch.process_rtsp_request(request)
        return response
        
    except ValidationError as e:
        logger.error("rtsp_validation_error", error=str(e), camera_id=request.camera_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error="ValidationError",
                message=e.message,
                details=e.details
            ).model_dump()
        )
    except RTSPConnectionError as e:
        logger.error("rtsp_connection_error", error=str(e), camera_id=request.camera_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=ErrorResponse(
                error="RTSPConnectionError",
                message=e.message,
                details=e.details
            ).model_dump()
        )
    except IngestionException as e:
        logger.error("rtsp_ingestion_error", error=str(e), camera_id=request.camera_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error=e.error_code,
                message=e.message,
                details=e.details
            ).model_dump()
        )


@router.post(
    "/upload",
    response_model=IngestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest uploaded images",
    description="Upload and ingest one or more images manually",
    responses={
        201: {"description": "Ingestion completed successfully"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        413: {"model": ErrorResponse, "description": "File too large"},
    }
)
async def ingest_upload(
    camera_id: str = Form(..., description="Unique camera identifier"),
    files: List[UploadFile] = File(..., description="Image files to upload"),
    meta: str = Form(None, description="Additional metadata (JSON string)"),
    orch: IngestionOrchestrator = Depends(get_orchestrator)
):
    """
    Ingest manually uploaded images.
    
    - **camera_id**: Unique camera identifier
    - **files**: One or more image files (jpg, png, bmp, tiff)
    - **meta**: Optional metadata as JSON string
    """
    try:
        logger.info(
            "upload_ingestion_request_received",
            camera_id=camera_id,
            file_count=len(files)
        )
        
        # Parse metadata if provided
        frame_meta = None
        if meta:
            import json
            meta_dict = json.loads(meta)
            frame_meta = FrameMetadata(**meta_dict)
        
        # Create request object
        request = UploadIngestionRequest(
            camera_id=camera_id,
            meta=frame_meta
        )
        
        # Prepare files for processing
        file_list = []
        for upload_file in files:
            # Read file content
            content = await upload_file.read()
            # Create file-like object
            from io import BytesIO
            file_obj = BytesIO(content)
            file_list.append((file_obj, upload_file.filename))
        
        response = await orch.process_upload_request(request, file_list)
        return response
        
    except ValidationError as e:
        logger.error("upload_validation_error", error=str(e), camera_id=camera_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error="ValidationError",
                message=e.message,
                details=e.details
            ).model_dump()
        )
    except IngestionException as e:
        logger.error("upload_ingestion_error", error=str(e), camera_id=camera_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error=e.error_code,
                message=e.message,
                details=e.details
            ).model_dump()
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                error="ValidationError",
                message="Invalid metadata JSON format",
                details={"field": "meta"}
            ).model_dump()
        )


@router.get(
    "/status/{request_id}",
    response_model=IngestionResponse,
    summary="Get ingestion request status",
    description="Retrieve the status and results of an ingestion request",
    responses={
        200: {"description": "Request status retrieved"},
        404: {"model": ErrorResponse, "description": "Request not found"},
    }
)
async def get_status(
    request_id: UUID,
    orch: IngestionOrchestrator = Depends(get_orchestrator)
):
    """
    Get the status of an ingestion request.
    
    - **request_id**: Unique request identifier (UUID)
    """
    try:
        logger.info("ingestion_status_request", request_id=str(request_id))
        
        response = await orch.get_request_status(request_id)
        
        if response is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorResponse(
                    error="NotFound",
                    message=f"Ingestion request {request_id} not found",
                    details={"request_id": str(request_id)}
                ).model_dump()
            )
        
        return response
        
    except DatabaseError as e:
        logger.error("status_retrieval_error", error=str(e), request_id=str(request_id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error="DatabaseError",
                message=e.message,
                details=e.details
            ).model_dump()
        )


@router.get(
    "/report/{job_id}",
    summary="Generate PDF Report",
    description="Generate and download a PDF report for a completed analysis job with optional AI insights",
    responses={
        200: {"description": "PDF report generated successfully", "content": {"application/pdf": {}}},
        404: {"model": ErrorResponse, "description": "Job not found"},
        400: {"model": ErrorResponse, "description": "Job not completed or data unavailable"},
    }
)
async def generate_report(job_id: str, use_ai: bool = True):
    """
    Generate a PDF report for a completed job with optional Gemini AI analysis.
    
    - **job_id**: Job identifier from the analysis pipeline
    - **use_ai**: Whether to include Gemini AI analysis (default: True)
    
    Returns a PDF file download with detailed insights.
    """
    try:
        logger.info("pdf_report_request", job_id=job_id, use_ai=use_ai)
        
        # In a real implementation, you would fetch job results from database/storage
        # For now, we'll create a mock structure based on typical results
        
        # TODO: Replace this with actual job result fetching
        # Example: results = await fetch_job_results(job_id)
        
        # Mock results structure (replace with actual data fetching)
        results = {
            "job_id": job_id,
            "num_changes": 4,
            "changes": [
                {
                    "id": 1,
                    "part": "Rear Wing",
                    "bbox": [520, 340, 680, 420],
                    "confidence": 0.87
                },
                {
                    "id": 2,
                    "part": "Front Tire",
                    "bbox": [180, 560, 280, 680],
                    "confidence": 0.72
                },
                {
                    "id": 3,
                    "part": "Side Panel",
                    "bbox": [340, 450, 480, 540],
                    "confidence": 0.65
                },
                {
                    "id": 4,
                    "part": "Underfloor",
                    "bbox": [260, 620, 540, 720],
                    "confidence": 0.58
                }
            ]
        }
        
        # Mock image paths (replace with actual paths from storage)
        image_paths = {
            "baseline": None,
            "current": None,
            "combined": None
        }
        
        # Generate AI analysis if requested
        ai_analysis = None
        if use_ai:
            try:
                logger.info("generating_ai_analysis", job_id=job_id)
                
                # Add context for better AI analysis
                context = {
                    "vehicle_type": "F1 Racing Car",
                    "inspection_type": "Post-Session Inspection",
                    "notes": "Automated visual inspection system analysis"
                }
                
                ai_analysis = analyze_with_gemini(
                    job_id=job_id,
                    results=results,
                    context=context
                )
                
                logger.info("ai_analysis_completed", job_id=job_id)
                
            except Exception as e:
                logger.warning(
                    "ai_analysis_failed_using_fallback",
                    job_id=job_id,
                    error=str(e)
                )
                # Continue without AI analysis if it fails
                ai_analysis = None
        
        # Generate PDF report with AI analysis
        pdf_buffer = generate_pdf_report(
            job_id=job_id,
            results=results,
            image_paths=image_paths,
            ai_analysis=ai_analysis
        )
        
        logger.info("pdf_report_generated", job_id=job_id, ai_powered=ai_analysis is not None)
        
        # Determine filename suffix
        filename_suffix = "_AI" if ai_analysis else ""
        
        # Return PDF as streaming response
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=F1_Analysis_Report{filename_suffix}_{job_id[:8]}.pdf"
            }
        )
        
    except FileNotFoundError:
        logger.error("pdf_report_job_not_found", job_id=job_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse(
                error="NotFound",
                message=f"Job {job_id} not found",
                details={"job_id": job_id}
            ).model_dump()
        )
    except Exception as e:
        logger.error("pdf_report_generation_failed", job_id=job_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error="ReportGenerationError",
                message="Failed to generate PDF report",
                details={"job_id": job_id, "error": str(e)}
            ).model_dump()
        )


@router.get(
    "/graphs",
    summary="Generate analysis graphs",
    description="Generate random F1 analysis graphs with realistic data",
    responses={
        200: {"description": "Graphs generated successfully"},
        500: {"description": "Graph generation failed"}
    }
)
async def get_analysis_graphs():
    """
    Generate F1 analysis graphs
    
    Returns a dictionary of base64-encoded graph images:
    - confidence_distribution: Change detection confidence histogram
    - component_damage: Component damage severity chart
    - lap_times: Lap time evolution
    - tire_wear: Tire wear progression
    - speed_heatmap: Speed distribution across track sections
    - performance_radar: Overall performance radar chart
    """
    try:
        logger.info("Generating F1 analysis graphs")
        graphs = generate_graphs()
        
        logger.info(f"Successfully generated {len(graphs)} graphs")
        return JSONResponse(
            content={
                "status": "success",
                "graphs": graphs,
                "count": len(graphs)
            }
        )
        
    except Exception as e:
        logger.error(f"Graph generation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorResponse(
                error="GraphGenerationError",
                message="Failed to generate analysis graphs",
                details={"error": str(e)}
            ).model_dump()
        )
