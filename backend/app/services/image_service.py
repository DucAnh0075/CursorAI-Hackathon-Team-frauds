"""
Image Service - Handles image processing
"""
from typing import Optional
import base64


class ImageService:
    """Service for image processing operations"""
    
    def process_image(self, base64_data: str) -> dict:
        """
        Process an uploaded image
        Returns metadata and processed data
        """
        # Remove data URL prefix if present
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]
        
        # Decode to get size info
        try:
            decoded = base64.b64decode(base64_data)
            return {
                "size_bytes": len(decoded),
                "valid": True
            }
        except Exception as e:
            return {
                "valid": False,
                "error": str(e)
            }
    
    def resize_image(
        self,
        base64_data: str,
        max_width: int = 1920,
        max_height: int = 1080
    ) -> str:
        """
        Resize image if too large
        TODO: Implement with Pillow
        """
        return base64_data
