"""
Simple access control middleware
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import os
import hashlib

# List of allowed access codes (hashed for security)
# Add codes by setting ALLOWED_ACCESS_CODES env var as comma-separated values
# e.g., ALLOWED_ACCESS_CODES=secret123,friend456,mycode789

def get_allowed_codes():
    """Get list of allowed access codes from environment"""
    codes = os.getenv("ALLOWED_ACCESS_CODES", "")
    if not codes:
        return None  # No access control if not configured
    return [code.strip() for code in codes.split(",") if code.strip()]


def hash_code(code: str) -> str:
    """Hash an access code"""
    return hashlib.sha256(code.encode()).hexdigest()


class AccessControlMiddleware(BaseHTTPMiddleware):
    """Middleware to check access codes"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip access control for health check and OPTIONS
        if request.url.path == "/health" or request.method == "OPTIONS":
            return await call_next(request)
        
        allowed_codes = get_allowed_codes()
        
        # If no codes configured, allow all access
        if allowed_codes is None:
            return await call_next(request)
        
        # Check for access code in header or query param
        access_code = request.headers.get("X-Access-Code") or request.query_params.get("access_code")
        
        if not access_code or access_code not in allowed_codes:
            raise HTTPException(
                status_code=403,
                detail="Access denied. Please provide a valid access code."
            )
        
        return await call_next(request)
