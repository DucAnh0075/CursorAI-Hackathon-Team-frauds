"""Generate visual slides for video."""

import os
from typing import List, Dict, Optional
from PIL import Image, ImageDraw, ImageFont
import textwrap
import math


class VisualGenerator:
    """Generate visual slides for educational videos."""
    
    def __init__(self, width: int = 1920, height: int = 1080):
        """Initialize visual generator with video dimensions."""
        self.width = width
        self.height = height
        self.background_color = (255, 255, 255)  # White
        self.text_color = (0, 0, 0)  # Black
        self.accent_color = (41, 128, 185)  # Blue
        self.title_color = (44, 62, 80)  # Dark blue-gray
        
    def create_title_slide(self, title: str, subtitle: Optional[str] = None) -> Image.Image:
        """Create a title slide."""
        img = Image.new('RGB', (self.width, self.height), self.background_color)
        draw = ImageDraw.Draw(img)
        
        # Try to load a nice font, fallback to default
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 80)
            subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 50)
        except:
            try:
                title_font = ImageFont.truetype("arial.ttf", 80)
                subtitle_font = ImageFont.truetype("arial.ttf", 50)
            except:
                title_font = ImageFont.load_default()
                subtitle_font = ImageFont.load_default()
        
        # Draw title
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_height = title_bbox[3] - title_bbox[1]
        title_x = (self.width - title_width) // 2
        title_y = self.height // 2 - (title_height + 60 if subtitle else 0)
        
        draw.text((title_x, title_y), title, fill=self.title_color, font=title_font)
        
        # Draw subtitle if provided
        if subtitle:
            subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
            subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
            subtitle_x = (self.width - subtitle_width) // 2
            subtitle_y = title_y + title_height + 40
            
            draw.text((subtitle_x, subtitle_y), subtitle, fill=self.text_color, font=subtitle_font)
        
        # Add decorative line
        line_y = self.height - 100
        draw.rectangle([self.width // 4, line_y, 3 * self.width // 4, line_y + 4], 
                      fill=self.accent_color)
        
        return img
    
    def create_content_slide(self, title: str, content: str, step_number: Optional[int] = None) -> Image.Image:
        """Create a content slide with title and text."""
        img = Image.new('RGB', (self.width, self.height), self.background_color)
        draw = ImageDraw.Draw(img)
        
        # Try to load fonts
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
            content_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 40)
        except:
            try:
                title_font = ImageFont.truetype("arial.ttf", 60)
                content_font = ImageFont.truetype("arial.ttf", 40)
            except:
                title_font = ImageFont.load_default()
                content_font = ImageFont.load_default()
        
        y_offset = 100
        
        # Draw step number badge if provided
        if step_number:
            badge_text = f"Step {step_number}"
            badge_bbox = draw.textbbox((0, 0), badge_text, font=title_font)
            badge_width = badge_bbox[2] - badge_bbox[0] + 40
            badge_height = badge_bbox[3] - badge_bbox[1] + 20
            
            # Draw badge background
            badge_x = 100
            badge_y = y_offset
            draw.rounded_rectangle(
                [badge_x, badge_y, badge_x + badge_width, badge_y + badge_height],
                radius=10, fill=self.accent_color
            )
            draw.text((badge_x + 20, badge_y + 10), badge_text, fill=(255, 255, 255), font=title_font)
            y_offset += badge_height + 40
        
        # Draw title
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (self.width - title_width) // 2
        draw.text((title_x, y_offset), title, fill=self.title_color, font=title_font)
        
        y_offset += title_bbox[3] - title_bbox[1] + 60
        
        # Draw content (wrapped text)
        margin = 150
        max_width = self.width - 2 * margin
        wrapped_lines = textwrap.wrap(content, width=60)  # Approximate character width
        
        line_height = 50
        for line in wrapped_lines[:15]:  # Limit to 15 lines
            if y_offset + line_height > self.height - 100:
                break
            draw.text((margin, y_offset), line, fill=self.text_color, font=content_font)
            y_offset += line_height
        
        return img
    
    def create_step_slide(self, step_number: int, step_text: str, explanation: str) -> Image.Image:
        """Create a slide for a specific step."""
        img = Image.new('RGB', (self.width, self.height), self.background_color)
        draw = ImageDraw.Draw(img)
        
        try:
            step_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 50)
            text_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
        except:
            try:
                step_font = ImageFont.truetype("arial.ttf", 50)
                text_font = ImageFont.truetype("arial.ttf", 36)
            except:
                step_font = ImageFont.load_default()
                text_font = ImageFont.load_default()
        
        y_offset = 150
        
        # Step header
        step_header = f"Step {step_number}"
        header_bbox = draw.textbbox((0, 0), step_header, font=step_font)
        header_x = (self.width - (header_bbox[2] - header_bbox[0])) // 2
        draw.text((header_x, y_offset), step_header, fill=self.accent_color, font=step_font)
        y_offset += header_bbox[3] - header_bbox[1] + 40
        
        # Step text
        margin = 200
        max_width = self.width - 2 * margin
        wrapped_step = textwrap.wrap(step_text, width=70)
        
        line_height = 45
        for line in wrapped_step[:8]:
            if y_offset + line_height > self.height - 200:
                break
            draw.text((margin, y_offset), line, fill=self.text_color, font=text_font)
            y_offset += line_height
        
        # Explanation
        if explanation:
            y_offset += 40
            wrapped_explanation = textwrap.wrap(explanation, width=70)
            for line in wrapped_explanation[:6]:
                if y_offset + line_height > self.height - 100:
                    break
                draw.text((margin, y_offset), line, fill=(60, 60, 60), font=text_font)
                y_offset += line_height
        
        return img
    
    def create_key_points_slide(self, key_points: List[str]) -> Image.Image:
        """Create a slide with key points."""
        img = Image.new('RGB', (self.width, self.height), self.background_color)
        draw = ImageDraw.Draw(img)
        
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
            point_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 45)
        except:
            try:
                title_font = ImageFont.truetype("arial.ttf", 60)
                point_font = ImageFont.truetype("arial.ttf", 45)
            except:
                title_font = ImageFont.load_default()
                point_font = ImageFont.load_default()
        
        # Title
        title = "Key Points"
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_x = (self.width - (title_bbox[2] - title_bbox[0])) // 2
        draw.text((title_x, 150), title, fill=self.title_color, font=title_font)
        
        # Key points
        y_offset = 300
        margin = 250
        line_height = 80
        
        for i, point in enumerate(key_points[:5], 1):  # Limit to 5 points
            if y_offset + line_height > self.height - 100:
                break
            
            # Bullet point
            bullet = "•"
            draw.text((margin, y_offset), bullet, fill=self.accent_color, font=point_font)
            
            # Point text
            wrapped = textwrap.wrap(point, width=60)
            point_y = y_offset
            for line in wrapped[:2]:  # Max 2 lines per point
                if point_y + line_height > self.height - 100:
                    break
                draw.text((margin + 50, point_y), line, fill=self.text_color, font=point_font)
                point_y += line_height - 20
            
            y_offset = point_y + 20
        
        return img
    
    def create_conclusion_slide(self, conclusion: str) -> Image.Image:
        """Create a conclusion slide."""
        return self.create_content_slide("Conclusion", conclusion)
