#!/usr/bin/env python3
"""Main entry point for AI Study Video Generator."""

import argparse
import sys
import os
from pathlib import Path

from utils import (
    detect_file_type, extract_text_from_pdf, extract_text_from_image,
    read_text_file, parse_exercise_sheet, ensure_output_dir
)
from video_generator import VideoGenerator


def main():
    """Main function to generate videos from input."""
    parser = argparse.ArgumentParser(
        description='AI Study Video Generator - Create educational videos from exercises'
    )
    parser.add_argument(
        '--input', '-i',
        required=True,
        help='Input file (PDF, image, or text) or direct question text'
    )
    parser.add_argument(
        '--output', '-o',
        default='output_video.mp4',
        help='Output video file path (default: output_video.mp4)'
    )
    parser.add_argument(
        '--title', '-t',
        help='Title for the video'
    )
    parser.add_argument(
        '--all-questions',
        action='store_true',
        help='Process all questions from exercise sheet (default: process first question only)'
    )
    
    args = parser.parse_args()
    
    # Ensure output directory exists
    ensure_output_dir(args.output)
    
    # Detect input type
    input_path = args.input
    
    # Check if input is a file or direct text
    if os.path.exists(input_path):
        file_type = detect_file_type(input_path)
        
        if file_type == 'pdf':
            print("Extracting text from PDF...")
            pages = extract_text_from_pdf(input_path)
            if not pages:
                print("Error: Could not extract text from PDF")
                sys.exit(1)
            content = "\n\n".join(pages)
            
        elif file_type == 'image':
            print("Extracting text from image...")
            content = extract_text_from_image(input_path)
            if not content:
                print("Error: Could not extract text from image")
                sys.exit(1)
                
        elif file_type == 'text':
            print("Reading text file...")
            content = read_text_file(input_path)
            if not content:
                print("Error: Could not read text file")
                sys.exit(1)
        else:
            print(f"Error: Unsupported file type: {file_type}")
            sys.exit(1)
    else:
        # Treat as direct text input
        print("Processing direct text input...")
        content = input_path
    
    # Parse exercises
    questions = parse_exercise_sheet(content)
    
    if not questions:
        print("Error: No questions found in input")
        sys.exit(1)
    
    print(f"Found {len(questions)} question(s)")
    
    # Initialize video generator
    try:
        generator = VideoGenerator()
        # Show which provider is being used
        provider = generator.content_gen.provider
        print(f"Using AI provider: {provider.upper()}")
    except Exception as e:
        print(f"Error initializing video generator: {e}")
        print("Make sure you have set MINIMAX_API_KEY, MANUS_API_KEY, or OPENAI_API_KEY in your .env file")
        sys.exit(1)
    
    try:
        # Generate video(s)
        if args.all_questions and len(questions) > 1:
            # Generate video for all questions
            all_question_texts = [q['text'] for q in questions]
            generator.generate_from_multiple_questions(all_question_texts, args.output)
        else:
            # Generate video for first question only
            first_question = questions[0]['text']
            title = args.title or f"Question {questions[0]['number']}"
            generator.generate_video(first_question, args.output, title)
        
        print(f"\n✅ Success! Video saved to: {args.output}")
        
    except KeyboardInterrupt:
        print("\n\nGeneration cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error generating video: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        generator.cleanup()


if __name__ == '__main__':
    main()
