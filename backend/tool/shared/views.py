# backend/tool/shared/views.py
# Base views and shared functionality

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
import logging
import pandas as pd
from typing import Union, Literal

logger = logging.getLogger(__name__)

# Define the file type return type for consistency
FileType = Literal['gsuite', 'mdm', 'siem', 'edr', 'sonicwall', 'meraki', 'unknown']

class BaseToolUploadView(APIView):
    """Base class for tool-specific upload views"""
    parser_classes = [MultiPartParser]
    tool_name = "Unknown"  # Default value, should be overridden in subclasses
    processor_function = None  # Must be overridden in subclasses

    def post(self, request, *args, **kwargs):
        uploaded_file = None  # Initialize to avoid unbound variable
        try:
            # Validate that subclass has set required attributes
            if self.processor_function is None:
                raise NotImplementedError(f"processor_function must be set in {self.__class__.__name__}")
            
            uploaded_file = request.FILES.get("file")
            if not uploaded_file:
                return Response(
                    {"error": "No file provided"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not uploaded_file.name.endswith(('.xlsx', '.xls')):
                return Response(
                    {"error": "Invalid file format. Please upload an Excel file."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Log file info for debugging
            logger.info(f"Processing {self.tool_name} file: {uploaded_file.name} (Size: {uploaded_file.size} bytes)")

            # Reset file position to ensure clean read
            uploaded_file.seek(0)
            
            # Process the file using the processor function
            result = self.processor_function(uploaded_file)
            
            # Validate result type
            if not isinstance(result, dict):
                logger.error(f"Invalid result type from processor: {type(result)}")
                return Response(
                    {"error": "Processing failed: Invalid result format"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Check for processing errors
            if "error" in result:
                error_msg = result.get("error", "Unknown processing error")
                logger.error(f"{self.tool_name} processing failed for {uploaded_file.name}: {error_msg}")
                return Response(
                    {"error": f"Processing failed: {error_msg}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Ensure file type is set for consistency
            result["fileType"] = self.tool_name.lower() if self.tool_name else "unknown"
            
            # Custom processing for specific tools
            result = self.post_process_result(result, uploaded_file)
            
            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return self.handle_processing_error(e, uploaded_file)

    def post_process_result(self, result, uploaded_file):
        """Override in subclasses for tool-specific post-processing"""
        return result

    def handle_processing_error(self, error, uploaded_file=None):
        """Handle processing errors with enhanced logging"""
        file_info = f"'{uploaded_file.name}'" if uploaded_file and hasattr(uploaded_file, 'name') else "unknown file"
        error_msg = str(error)
        
        logger.error(f"Critical error processing {self.tool_name} file {file_info}: {error_msg}")
        logger.error(f"Error type: {type(error).__name__}")
        
        # Handle specific error types
        if isinstance(error, NotImplementedError):
            return Response(
                {
                    "error": "Configuration error: View not properly configured",
                    "details": str(error)
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Return user-friendly error message
        if "JSON" in error_msg or "NaN" in error_msg or "nan" in error_msg:
            return Response(
                {
                    "error": "Data processing error: Invalid numerical values detected in the file",
                    "details": "Please ensure your Excel file contains valid numerical data without empty cells in critical columns"
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        elif "Excel" in error_msg or "xlsx" in error_msg:
            return Response(
                {
                    "error": "File format error: Unable to read the Excel file",
                    "details": "Please ensure the file is not corrupted and contains valid Excel data"
                }, 
                status=status.HTTP_400_BAD_REQUEST
            )
        else:
            return Response(
                {
                    "error": f"Processing failed: {error_msg}",
                    "details": "An unexpected error occurred while processing your file"
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FileAnalysisView(APIView):
    """Shared file analysis functionality"""
    parser_classes = [MultiPartParser]

    def analyze_file_contents(self, uploaded_file):
        """Analyze file contents and return debug information"""
        try:
            excel_data = pd.ExcelFile(uploaded_file)
            sheet_names = excel_data.sheet_names
            
            # Import file type detection with proper typing
            get_file_type = self._get_file_type_function()
            
            debug_info = {
                "fileName": uploaded_file.name,
                "fileSize": uploaded_file.size,
                "sheetCount": len(sheet_names),
                "sheetNames": sheet_names,
                "detectedType": get_file_type(uploaded_file),
                "analysis": {}
            }
            
            # Analyze each sheet
            for sheet_name in sheet_names:
                try:
                    df = pd.read_excel(uploaded_file, sheet_name=sheet_name, nrows=3)
                    debug_info["analysis"][sheet_name] = {
                        "columns": list(df.columns),
                        "rowCount": len(df),
                        "sampleData": df.head(2).to_dict(orient="records") if len(df) > 0 else []
                    }
                except Exception as e:
                    debug_info["analysis"][sheet_name] = {
                        "error": str(e)
                    }
            
            return debug_info
            
        except Exception as e:
            logger.error(f"Error analyzing file: {str(e)}")
            raise

    def _get_file_type_function(self):
        """Get the file type detection function with proper fallback"""
        # Try to import the actual function first
        try:
            from .file_utils import get_file_type
            return get_file_type
        except ImportError:
            # Fallback import path
            try:
                from ..shared.file_utils import get_file_type
                return get_file_type
            except ImportError:
                # If still fails, provide a fallback function with correct typing
                def get_file_type_fallback(file) -> FileType:
                    """Fallback file type detection that returns 'unknown'"""
                    return "unknown"
                
                logger.warning("Could not import get_file_type function, using fallback")
                return get_file_type_fallback