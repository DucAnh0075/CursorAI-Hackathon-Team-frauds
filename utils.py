"""Utility functions for parsing inputs and file handling."""

import os
import re
from pathlib import Path
from typing import Optional, List, Dict
from PIL import Image
import pytesseract
from pdf2image import convert_from_path


def detect_file_type(file_path: str) -> str:
    """Detect the type of input file."""
    ext = Path(file_path).suffix.lower()
    if ext == '.pdf':
        return 'pdf'
    elif ext in ['.png', '.jpg', '.jpeg', '.gif', '.bmp']:
        return 'image'
    elif ext in ['.txt', '.md']:
        return 'text'
    else:
        return 'unknown'


def extract_text_from_pdf(pdf_path: str) -> List[str]:
    """Extract text from PDF file, returning list of pages."""
    try:
        images = convert_from_path(pdf_path, dpi=200)
        pages = []
        for image in images:
            text = pytesseract.image_to_string(image)
            pages.append(text.strip())
        return pages
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return []


def extract_text_from_image(image_path: str) -> str:
    """Extract text from image using OCR."""
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        print(f"Error extracting image: {e}")
        return ""


def read_text_file(file_path: str) -> str:
    """Read text from a text file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading text file: {e}")
        return ""


def parse_exercise_sheet(content: str) -> List[Dict[str, str]]:
    """Parse exercise sheet content into individual questions."""
    questions = []
    
    # Try to split by common question patterns
    # Pattern 1: Numbered questions (1., 2., Question 1, etc.)
    patterns = [
        r'(?:^|\n)\s*(\d+)[\.\)]\s*(.+?)(?=\n\s*\d+[\.\)]|\Z)',
        r'(?:^|\n)\s*Question\s+(\d+)[:\.]\s*(.+?)(?=\n\s*Question|\Z)',
        r'(?:^|\n)\s*Problem\s+(\d+)[:\.]\s*(.+?)(?=\n\s*Problem|\Z)',
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, content, re.DOTALL | re.MULTILINE | re.IGNORECASE)
        for match in matches:
            question_num = match.group(1) if match.groups() else "1"
            question_text = match.group(2) if len(match.groups()) > 1 else match.group(0)
            questions.append({
                'number': question_num,
                'text': question_text.strip()
            })
        if questions:
            break
    
    # If no pattern matches, treat entire content as one question
    if not questions:
        questions.append({
            'number': '1',
            'text': content.strip()
        })
    
    return questions


def clean_text(text: str) -> str:
    """Clean and normalize text."""
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters that might interfere
    text = text.strip()
    return text


def ensure_output_dir(output_path: str):
    """Ensure the output directory exists."""
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
