"""Text-to-speech narration generation."""

import os
from typing import Optional
from gtts import gTTS
import tempfile


class Narrator:
    """Generate narration audio from text."""
    
    def __init__(self, language: str = 'en', slow: bool = False):
        """Initialize the narrator."""
        self.language = language
        self.slow = slow
        self.temp_dir = tempfile.mkdtemp()
    
    def text_to_speech(self, text: str, output_path: Optional[str] = None) -> str:
        """
        Convert text to speech audio file.
        
        Args:
            text: Text to convert to speech
            output_path: Optional path to save audio file
            
        Returns:
            Path to the generated audio file
        """
        if not output_path:
            output_path = os.path.join(self.temp_dir, f"narration_{hash(text) % 10000}.mp3")
        
        try:
            # Split text into chunks if too long (gTTS has limits)
            chunks = self._split_text(text, max_length=5000)
            
            if len(chunks) == 1:
                # Single chunk
                tts = gTTS(text=text, lang=self.language, slow=self.slow)
                tts.save(output_path)
            else:
                # Multiple chunks - combine them
                import subprocess
                temp_files = []
                for i, chunk in enumerate(chunks):
                    chunk_file = os.path.join(self.temp_dir, f"chunk_{i}.mp3")
                    tts = gTTS(text=chunk, lang=self.language, slow=self.slow)
                    tts.save(chunk_file)
                    temp_files.append(chunk_file)
                
                # Combine audio files using ffmpeg
                self._combine_audio_files(temp_files, output_path)
                
                # Clean up temp files
                for f in temp_files:
                    if os.path.exists(f):
                        os.remove(f)
            
            return output_path
            
        except Exception as e:
            print(f"Error generating speech: {e}")
            # Fallback: create a silent audio file
            self._create_silent_audio(output_path, duration=5)
            return output_path
    
    def _split_text(self, text: str, max_length: int = 5000) -> list:
        """Split text into chunks that fit within TTS limits."""
        if len(text) <= max_length:
            return [text]
        
        chunks = []
        sentences = text.split('. ')
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) + 2 <= max_length:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + ". "
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _combine_audio_files(self, audio_files: list, output_path: str):
        """Combine multiple audio files into one."""
        try:
            import subprocess
            # Create a file list for ffmpeg
            file_list = os.path.join(self.temp_dir, "file_list.txt")
            with open(file_list, 'w') as f:
                for audio_file in audio_files:
                    f.write(f"file '{os.path.abspath(audio_file)}'\n")
            
            # Use ffmpeg to concatenate
            cmd = [
                'ffmpeg', '-f', 'concat', '-safe', '0',
                '-i', file_list, '-c', 'copy', output_path, '-y'
            ]
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Clean up
            if os.path.exists(file_list):
                os.remove(file_list)
                
        except Exception as e:
            print(f"Error combining audio: {e}")
            # Fallback: just use the first file
            import shutil
            if audio_files and os.path.exists(audio_files[0]):
                shutil.copy(audio_files[0], output_path)
    
    def _create_silent_audio(self, output_path: str, duration: int = 5):
        """Create a silent audio file as fallback."""
        try:
            import subprocess
            cmd = [
                'ffmpeg', '-f', 'lavfi', '-i', f'anullsrc=r=44100:cl=stereo',
                '-t', str(duration), '-q:a', '9', '-acodec', 'libmp3lame',
                output_path, '-y'
            ]
            subprocess.run(cmd, check=True, capture_output=True)
        except:
            # If ffmpeg fails, create empty file
            with open(output_path, 'w') as f:
                pass
    
    def estimate_duration(self, text: str, words_per_minute: int = 150) -> float:
        """Estimate audio duration in seconds."""
        word_count = len(text.split())
        duration_minutes = word_count / words_per_minute
        return duration_minutes * 60
    
    def cleanup(self):
        """Clean up temporary files."""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir, ignore_errors=True)
