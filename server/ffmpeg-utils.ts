import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import ffmpeg from 'ffmpeg-static';
import { storage } from './storage';
import { type Stream, type InsertSegment } from '@shared/schema';

const execAsync = promisify(exec);

// Ensure directories exist
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const SEGMENTS_DIR = path.join(UPLOAD_DIR, 'segments');
const THUMBNAILS_DIR = path.join(UPLOAD_DIR, 'thumbnails');

// Create directories if they don't exist
function ensureDirectoriesExist() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(SEGMENTS_DIR)) {
    fs.mkdirSync(SEGMENTS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(THUMBNAILS_DIR)) {
    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
  }
}

// Record stream from jaco.live
export async function recordStream(stream: Stream): Promise<void> {
  ensureDirectoriesExist();
  
  try {
    // Update stream status to recording
    await storage.updateStreamStatus(stream.id, 'recording');
    
    // Create base filename for this stream
    const streamBaseName = `stream_${stream.id}_${Date.now()}`;
    const outputPath = path.join(UPLOAD_DIR, `${streamBaseName}.mp4`);
    
    // Use FFmpeg to record the stream
    const command = `${ffmpeg} -i "${stream.url}" -c copy "${outputPath}"`;
    
    // Execute ffmpeg command to record the stream
    const recordingProcess = exec(command);
    
    // Set a timeout to stop the recording after a reasonable time (e.g., 1 hour)
    // In a real application, you'd want a better mechanism to control recording duration
    const maxDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    
    setTimeout(() => {
      if (recordingProcess.pid) {
        process.kill(recordingProcess.pid, 'SIGTERM');
      }
    }, maxDuration);
    
    // When recording is complete or terminated
    recordingProcess.on('exit', async (code) => {
      if (code === 0 || code === null) {
        // Recording finished or was terminated normally
        await segmentVideo(stream.id, outputPath, streamBaseName);
        await storage.markStreamCompleted(stream.id);
      } else {
        // Recording failed
        await storage.updateStreamStatus(stream.id, 'error', `Recording failed with code ${code}`);
      }
    });
    
    recordingProcess.on('error', async (error) => {
      await storage.updateStreamStatus(stream.id, 'error', error.message);
    });
  } catch (error) {
    await storage.updateStreamStatus(stream.id, 'error', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Segment the recorded video into 5-minute clips
async function segmentVideo(streamId: number, videoPath: string, streamBaseName: string): Promise<void> {
  try {
    // 5 minutes = 300 seconds
    const segmentDuration = 300;
    const segmentsOutputPattern = path.join(SEGMENTS_DIR, `${streamBaseName}_%03d.mp4`);
    
    // FFmpeg command to split video into 5-minute segments
    const command = `${ffmpeg} -i "${videoPath}" -c copy -map 0 -segment_time ${segmentDuration} -f segment -reset_timestamps 1 "${segmentsOutputPattern}"`;
    
    await execAsync(command);
    
    // Get a list of all generated segment files
    const segmentFiles = fs.readdirSync(SEGMENTS_DIR)
      .filter(file => file.startsWith(streamBaseName))
      .sort((a, b) => {
        // Extract segment numbers and compare
        const numA = parseInt(a.split('_').pop()?.split('.')[0] || '0', 10);
        const numB = parseInt(b.split('_').pop()?.split('.')[0] || '0', 10);
        return numA - numB;
      });
    
    // Create thumbnail for each segment and add to database
    for (let i = 0; i < segmentFiles.length; i++) {
      const segmentFile = segmentFiles[i];
      const segmentPath = path.join(SEGMENTS_DIR, segmentFile);
      const thumbnailName = `thumb_${streamBaseName}_${i.toString().padStart(3, '0')}.jpg`;
      const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailName);
      
      // Generate thumbnail at 2 seconds into the video
      const thumbnailCommand = `${ffmpeg} -i "${segmentPath}" -ss 00:00:02 -vframes 1 "${thumbnailPath}"`;
      await execAsync(thumbnailCommand);
      
      // Get duration of segment
      const durationCommand = `${ffmpeg} -i "${segmentPath}" 2>&1 | grep "Duration"`;
      const { stdout } = await execAsync(durationCommand);
      
      // Parse duration (rough estimation - ffprobe would be more accurate)
      const durationMatch = stdout.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      let durationSeconds = segmentDuration; // Default if we can't parse
      
      if (durationMatch && durationMatch.length >= 4) {
        const hours = parseInt(durationMatch[1], 10);
        const minutes = parseInt(durationMatch[2], 10);
        const seconds = parseFloat(durationMatch[3]);
        durationSeconds = hours * 3600 + minutes * 60 + seconds;
      }
      
      // Store segment in database
      const segment: InsertSegment = {
        streamId,
        filePath: segmentPath,
        fileName: segmentFile,
        duration: Math.round(durationSeconds),
        position: i,
        thumbnail: thumbnailPath,
      };
      
      await storage.createSegment(segment);
    }
    
    // Optionally remove the original file to save space
    // fs.unlinkSync(videoPath);
  } catch (error) {
    console.error('Error segmenting video:', error);
    await storage.updateStreamStatus(streamId, 'error', error instanceof Error ? error.message : 'Error during segmentation');
  }
}
