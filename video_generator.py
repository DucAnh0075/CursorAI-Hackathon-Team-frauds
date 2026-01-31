"""Main video generation orchestrator."""

import os
from typing import List, Dict, Optional
from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips
from PIL import Image
import tempfile

from content_generator import ContentGenerator
from narrator import Narrator
from visual_generator import VisualGenerator


class VideoGenerator:
    """Orchestrate the creation of educational videos."""
    
    def __init__(self, fps: int = 24):
        """Initialize the video generator."""
        self.fps = fps
        self.content_gen = ContentGenerator()
        self.narrator = Narrator()
        self.visual_gen = VisualGenerator()
        self.temp_dir = tempfile.mkdtemp()
    
    def generate_video(self, question: str, output_path: str, 
                      title: Optional[str] = None) -> str:
        """
        Generate a complete educational video from a question.
        
        Args:
            question: The question or exercise to explain
            output_path: Path where the video will be saved
            title: Optional title for the video
            
        Returns:
            Path to the generated video
        """
        print(f"Generating video for question: {question[:50]}...")
        
        # Step 1: Generate content
        print("Step 1/5: Generating educational content...")
        explanation = self.content_gen.generate_explanation(question)
        
        # Step 2: Generate narration script
        print("Step 2/5: Creating narration script...")
        narration_script = self.content_gen.generate_narration_script(explanation)
        
        # Step 3: Generate audio
        print("Step 3/5: Generating narration audio...")
        audio_path = os.path.join(self.temp_dir, "narration.mp3")
        self.narrator.text_to_speech(narration_script, audio_path)
        
        # Step 4: Generate visuals
        print("Step 4/5: Creating visual slides...")
        slides = self._create_slides(explanation, title or "Study Video")
        
        # Step 5: Assemble video
        print("Step 5/5: Assembling video...")
        video_path = self._assemble_video(slides, audio_path, output_path)
        
        print(f"Video generated successfully: {output_path}")
        return video_path
    
    def _create_slides(self, explanation: Dict, title: str) -> List[Image.Image]:
        """Create all slides for the video."""
        slides = []
        
        # Title slide
        slides.append(self.visual_gen.create_title_slide(title, "Educational Explanation"))
        
        # Introduction slide
        if explanation.get('introduction'):
            slides.append(self.visual_gen.create_content_slide(
                "Introduction", 
                explanation['introduction']
            ))
        
        # Step slides
        for step in explanation.get('steps', []):
            step_num = int(step.get('number', 1))
            step_text = step.get('text', '')
            slides.append(self.visual_gen.create_step_slide(
                step_num, 
                step_text,
                step_text  # Using step_text as explanation for now
            ))
        
        # Key points slide
        if explanation.get('key_points'):
            slides.append(self.visual_gen.create_key_points_slide(
                explanation['key_points']
            ))
        
        # Conclusion slide
        if explanation.get('conclusion'):
            slides.append(self.visual_gen.create_conclusion_slide(
                explanation['conclusion']
            ))
        
        return slides
    
    def _assemble_video(self, slides: List[Image.Image], audio_path: str, 
                       output_path: str) -> str:
        """Assemble slides and audio into final video."""
        # Save slides as temporary image files
        slide_paths = []
        for i, slide in enumerate(slides):
            slide_path = os.path.join(self.temp_dir, f"slide_{i}.png")
            slide.save(slide_path)
            slide_paths.append(slide_path)
        
        # Load audio to get duration
        try:
            audio_clip = AudioFileClip(audio_path)
            total_duration = audio_clip.duration
        except Exception as e:
            print(f"Error loading audio: {e}")
            total_duration = len(slides) * 5  # Default 5 seconds per slide
        
        # Calculate duration per slide
        duration_per_slide = total_duration / len(slides) if slides else 5
        
        # Create video clips from slides
        video_clips = []
        for slide_path in slide_paths:
            clip = ImageClip(slide_path, duration=duration_per_slide)
            clip = clip.set_fps(self.fps)
            video_clips.append(clip)
        
        # Concatenate all clips
        if video_clips:
            final_video = concatenate_videoclips(video_clips, method="compose")
            
            # Add audio
            if os.path.exists(audio_path):
                try:
                    audio_clip = AudioFileClip(audio_path)
                    # Trim audio if it's longer than video
                    if audio_clip.duration > final_video.duration:
                        audio_clip = audio_clip.subclip(0, final_video.duration)
                    final_video = final_video.set_audio(audio_clip)
                except Exception as e:
                    print(f"Warning: Could not add audio: {e}")
            
            # Write video file
            final_video.write_videofile(
                output_path,
                fps=self.fps,
                codec='libx264',
                audio_codec='aac',
                temp_audiofile=os.path.join(self.temp_dir, 'temp_audio.m4a'),
                remove_temp=True,
                verbose=False,
                logger=None
            )
            
            # Clean up
            final_video.close()
            if 'audio_clip' in locals():
                audio_clip.close()
        
        return output_path
    
    def generate_from_multiple_questions(self, questions: List[str], 
                                       output_path: str) -> str:
        """Generate a video from multiple questions."""
        print(f"Generating video for {len(questions)} questions...")
        
        all_slides = []
        all_audio_paths = []
        
        for i, question in enumerate(questions, 1):
            print(f"Processing question {i}/{len(questions)}...")
            
            # Generate content for this question
            explanation = self.content_gen.generate_explanation(question)
            narration_script = self.content_gen.generate_narration_script(explanation)
            
            # Generate audio
            audio_path = os.path.join(self.temp_dir, f"narration_{i}.mp3")
            self.narrator.text_to_speech(narration_script, audio_path)
            all_audio_paths.append(audio_path)
            
            # Generate slides
            slides = self._create_slides(explanation, f"Question {i}")
            all_slides.extend(slides)
        
        # Combine all audio
        combined_audio = os.path.join(self.temp_dir, "combined_narration.mp3")
        self._combine_audio_files(all_audio_paths, combined_audio)
        
        # Assemble video
        video_path = self._assemble_video(all_slides, combined_audio, output_path)
        
        return video_path
    
    def _combine_audio_files(self, audio_paths: List[str], output_path: str):
        """Combine multiple audio files."""
        try:
            from moviepy.editor import concatenate_audioclips, AudioFileClip
            
            audio_clips = [AudioFileClip(path) for path in audio_paths if os.path.exists(path)]
            if audio_clips:
                combined = concatenate_audioclips(audio_clips)
                combined.write_audiofile(output_path, verbose=False, logger=None)
                combined.close()
                for clip in audio_clips:
                    clip.close()
        except Exception as e:
            print(f"Error combining audio: {e}")
            # Fallback: use first audio file
            if audio_paths and os.path.exists(audio_paths[0]):
                import shutil
                shutil.copy(audio_paths[0], output_path)
    
    def cleanup(self):
        """Clean up temporary files."""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir, ignore_errors=True)
        self.narrator.cleanup()
