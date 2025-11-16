"""
Gemini AI Analysis Service
Generates detailed insights and analysis from visual detection results using Google's Gemini AI.
"""
import os
from typing import Dict, List, Any, Optional
from pathlib import Path
import json

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

from utils.logger import get_logger

logger = get_logger(__name__)


class GeminiAnalyzer:
    """Analyzes visual detection results using Gemini AI to generate detailed insights."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini analyzer.
        
        Args:
            api_key: Google AI API key. If None, will look for GEMINI_API_KEY env var.
        """
        self.logger = get_logger(__name__)
        
        if not GEMINI_AVAILABLE:
            self.logger.warning("google-generativeai not installed. AI analysis disabled.")
            self.enabled = False
            return
        
        # Get API key from parameter or environment
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            self.logger.warning(
                "gemini_api_key_not_configured",
                message="GEMINI_API_KEY not found. AI analysis disabled."
            )
            self.enabled = False
            return
        
        try:
            # Configure Gemini
            genai.configure(api_key=self.api_key)
            
            # Use Gemini 1.5 Flash for fast, cost-effective analysis
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            
            self.enabled = True
            self.logger.info("gemini_analyzer_initialized", model="gemini-1.5-flash")
            
        except Exception as e:
            self.logger.error("gemini_initialization_failed", error=str(e))
            self.enabled = False
    
    def analyze_changes(
        self,
        job_id: str,
        results: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze detection results and generate detailed insights.
        
        Args:
            job_id: Unique job identifier
            results: Detection results with changes, metrics, etc.
            context: Additional context (vehicle type, inspection type, etc.)
            
        Returns:
            Dictionary with AI-generated analysis including:
            - executive_summary: High-level overview
            - detailed_analysis: Component-by-component analysis
            - risk_assessment: Risk levels and priorities
            - recommendations: Actionable recommendations
            - technical_insights: Technical observations
        """
        if not self.enabled:
            self.logger.warning("gemini_analysis_skipped", reason="Gemini not enabled")
            return self._generate_fallback_analysis(results)
        
        try:
            self.logger.info("gemini_analysis_starting", job_id=job_id)
            
            # Prepare analysis prompt
            prompt = self._create_analysis_prompt(job_id, results, context)
            
            # Generate analysis with Gemini
            response = self.model.generate_content(prompt)
            
            # Parse response
            analysis = self._parse_gemini_response(response.text)
            
            self.logger.info(
                "gemini_analysis_completed",
                job_id=job_id,
                sections=len(analysis)
            )
            
            return analysis
            
        except Exception as e:
            self.logger.error(
                "gemini_analysis_failed",
                job_id=job_id,
                error=str(e),
                exc_info=True
            )
            return self._generate_fallback_analysis(results)
    
    def _create_analysis_prompt(
        self,
        job_id: str,
        results: Dict[str, Any],
        context: Optional[Dict[str, Any]]
    ) -> str:
        """Create structured prompt for Gemini analysis."""
        
        num_changes = results.get("num_changes", 0)
        changes = results.get("changes", [])
        
        # Build context section
        context_info = ""
        if context:
            vehicle_type = context.get("vehicle_type", "F1 Racing Car")
            inspection_type = context.get("inspection_type", "Post-Race")
            context_info = f"""
VEHICLE CONTEXT:
- Vehicle Type: {vehicle_type}
- Inspection Type: {inspection_type}
- Additional Notes: {context.get("notes", "N/A")}
"""
        
        # Build changes summary
        changes_summary = ""
        if changes:
            changes_summary = "DETECTED CHANGES:\n"
            for change in changes:
                changes_summary += f"""
- Change #{change.get('id')}:
  Component: {change.get('part', 'Unknown')}
  Confidence: {change.get('confidence', 0):.1%}
  Location: {change.get('bbox', [])}
"""
        else:
            changes_summary = "DETECTED CHANGES: None - Vehicle appears to be in baseline condition.\n"
        
        # Calculate statistics
        if changes:
            confidences = [c.get('confidence', 0) for c in changes]
            avg_confidence = sum(confidences) / len(confidences)
            max_confidence = max(confidences)
            min_confidence = min(confidences)
            
            stats = f"""
STATISTICS:
- Total Changes: {num_changes}
- Average Confidence: {avg_confidence:.1%}
- Highest Confidence: {max_confidence:.1%}
- Lowest Confidence: {min_confidence:.1%}
"""
        else:
            stats = f"""
STATISTICS:
- Total Changes: 0
- Status: No anomalies detected
"""
        
        # Build complete prompt
        prompt = f"""You are an expert F1 racing vehicle inspector analyzing visual change detection results from an AI-powered inspection system.

JOB ID: {job_id}
{context_info}
{stats}
{changes_summary}

Please provide a comprehensive analysis in the following structured format:

## EXECUTIVE SUMMARY
Provide a 2-3 sentence high-level overview of the inspection results, highlighting the most critical findings.

## DETAILED COMPONENT ANALYSIS
For each detected change, provide:
- Component assessment and severity
- Potential causes
- Impact on performance/safety
- Urgency level

## RISK ASSESSMENT
Evaluate overall risk levels:
- Safety Risk: [Low/Medium/High/Critical]
- Performance Risk: [Low/Medium/High/Critical]
- Compliance Risk: [Low/Medium/High/Critical]
Priority Action Items: List 3-5 prioritized actions

## TECHNICAL INSIGHTS
Provide technical observations:
- Pattern analysis (if multiple related changes)
- Possible root causes
- Correlation between changes
- Technical recommendations

## MAINTENANCE RECOMMENDATIONS
Provide specific, actionable recommendations:
- Immediate actions required
- Short-term maintenance tasks
- Long-term monitoring suggestions
- Preventive measures

## NEXT STEPS
Outline clear next steps for the technical team.

Format your response clearly with markdown headers. Be specific, technical, and actionable. Focus on F1 racing context and regulations.
"""
        
        return prompt
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Gemini's response into structured sections."""
        
        sections = {
            "executive_summary": "",
            "detailed_analysis": "",
            "risk_assessment": "",
            "technical_insights": "",
            "recommendations": "",
            "next_steps": "",
            "raw_analysis": response_text
        }
        
        # Simple parsing - split by markdown headers
        current_section = None
        section_map = {
            "executive summary": "executive_summary",
            "detailed component analysis": "detailed_analysis",
            "risk assessment": "risk_assessment",
            "technical insights": "technical_insights",
            "maintenance recommendations": "recommendations",
            "next steps": "next_steps"
        }
        
        lines = response_text.split('\n')
        for line in lines:
            # Check if line is a header
            if line.startswith('##'):
                header_text = line.replace('#', '').strip().lower()
                current_section = section_map.get(header_text)
            elif current_section:
                sections[current_section] += line + '\n'
        
        # Clean up sections
        for key in sections:
            if key != "raw_analysis":
                sections[key] = sections[key].strip()
        
        return sections
    
    def _generate_fallback_analysis(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate basic analysis when Gemini is unavailable."""
        
        num_changes = results.get("num_changes", 0)
        changes = results.get("changes", [])
        
        if num_changes == 0:
            return {
                "executive_summary": "No changes detected during visual inspection. Vehicle appears to be in baseline condition with no visible anomalies.",
                "detailed_analysis": "No component changes were identified. All systems appear nominal.",
                "risk_assessment": "Risk Level: LOW\nNo immediate concerns identified.",
                "technical_insights": "The inspection system found no deviations from the baseline image, indicating stable vehicle condition.",
                "recommendations": "Continue regular inspection schedule. No immediate action required.",
                "next_steps": "1. Archive inspection results\n2. Schedule next routine inspection\n3. Monitor for future changes",
                "raw_analysis": "Fallback analysis - AI unavailable",
                "ai_powered": False
            }
        
        # Group changes by component
        component_groups: Dict[str, List[Dict]] = {}
        for change in changes:
            part = change.get("part", "Unknown")
            if part not in component_groups:
                component_groups[part] = []
            component_groups[part].append(change)
        
        # Calculate average confidence
        confidences = [c.get('confidence', 0) for c in changes]
        avg_confidence = sum(confidences) / len(confidences)
        
        # Generate severity assessment
        if num_changes <= 2:
            severity = "LOW"
            severity_desc = "Minor changes detected"
        elif num_changes <= 5:
            severity = "MEDIUM"
            severity_desc = "Moderate changes requiring review"
        else:
            severity = "HIGH"
            severity_desc = "Significant changes requiring immediate attention"
        
        # Build detailed analysis
        detailed_analysis = f"Total of {num_changes} changes detected across {len(component_groups)} component(s):\n\n"
        for part, part_changes in component_groups.items():
            detailed_analysis += f"- {part}: {len(part_changes)} change(s) detected\n"
        
        return {
            "executive_summary": f"{num_changes} changes detected during inspection. {severity_desc}. Average detection confidence: {avg_confidence:.1%}.",
            "detailed_analysis": detailed_analysis,
            "risk_assessment": f"Overall Risk: {severity}\nDetection Confidence: {avg_confidence:.1%}\nComponents Affected: {len(component_groups)}",
            "technical_insights": f"Automated analysis detected variations in {len(component_groups)} component area(s). Manual verification recommended for changes with confidence below 70%.",
            "recommendations": f"1. Review all detected changes\n2. Focus on high-confidence detections (>80%)\n3. Schedule detailed inspection of affected components\n4. Document findings in maintenance log",
            "next_steps": "1. Technical team review\n2. Component-level inspection\n3. Determine if repairs needed\n4. Update vehicle status",
            "raw_analysis": "Fallback analysis - AI unavailable",
            "ai_powered": False
        }


def analyze_with_gemini(
    job_id: str,
    results: Dict[str, Any],
    context: Optional[Dict[str, Any]] = None,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Convenience function to analyze results with Gemini AI.
    
    Args:
        job_id: Unique job identifier
        results: Detection results
        context: Additional context
        api_key: Optional API key (uses env var if not provided)
        
    Returns:
        Analysis dictionary with AI insights
    """
    analyzer = GeminiAnalyzer(api_key=api_key)
    return analyzer.analyze_changes(job_id, results, context)
