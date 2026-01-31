# Videos Directory

This directory stores downloaded Minimax AI generated videos.

## Structure

Videos are saved with the naming pattern:
```
video_<task_id>_<timestamp>.mp4
```

Example: `video_361720188367060_1738339200000.mp4`

## Download Videos

Use the download script:
```bash
node download-video.js <task_id>
```

## Storage

- Videos are saved as MP4 files
- Typical size: 1-5 MB for 5-second videos
- Videos remain on Minimax servers and are cached here locally

## Cleanup

You can safely delete videos from this directory - they can be re-downloaded using the task ID if needed.
