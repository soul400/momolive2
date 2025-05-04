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
// Store active recording processes by stream ID
export const activeRecordings = new Map<number, { process: ReturnType<typeof exec>, outputPath: string, streamBaseName: string }>();

// Record stream from jaco.live
export async function recordStream(stream: Stream): Promise<void> {
  ensureDirectoriesExist();
  
  try {
    // Check if stream is already recording
    if (activeRecordings.has(stream.id)) {
      console.log(`Stream ${stream.id} is already recording`);
      return;
    }
    
    // Update stream status to recording
    await storage.updateStreamStatus(stream.id, 'recording');
    
    // Create base filename for this stream
    const streamBaseName = `stream_${stream.id}_${Date.now()}`;
    const outputPath = path.join(UPLOAD_DIR, `${streamBaseName}.mp4`);
    
    // Use FFmpeg with improved options for live stream
    const command = `${ffmpeg} -y -re -i "${stream.url}" -c copy -f mp4 "${outputPath}"`;
    
    console.log(`Starting recording of stream ${stream.id} with command: ${command}`);
    
    // Execute ffmpeg command to record the stream
    const recordingProcess = exec(command);
    
    // Store the active recording process
    activeRecordings.set(stream.id, {
      process: recordingProcess,
      outputPath,
      streamBaseName
    });
    
    // Log stdout and stderr for debugging
    if (recordingProcess.stdout) {
      recordingProcess.stdout.on('data', (data) => {
        console.log(`[ffmpeg-stdout] ${data.toString().trim()}`);
      });
    }
    
    if (recordingProcess.stderr) {
      recordingProcess.stderr.on('data', (data) => {
        console.log(`[ffmpeg-stderr] ${data.toString().trim()}`);
      });
    }
    
    // Set a timeout to stop the recording after a reasonable time (e.g., 3 hours)
    const maxDuration = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    
    const timeoutId = setTimeout(() => {
      stopRecording(stream.id);
    }, maxDuration);
    
    // When recording is complete or terminated
    recordingProcess.on('exit', async (code) => {
      // Clear the timeout if process exits before timeout
      clearTimeout(timeoutId);
      
      // Remove from active recordings
      const recordingData = activeRecordings.get(stream.id);
      activeRecordings.delete(stream.id);
      
      if (!recordingData) return;
      
      if (code === 0 || code === null) {
        // Recording finished or was terminated normally
        console.log(`Recording of stream ${stream.id} completed successfully`);
        await segmentVideo(stream.id, recordingData.outputPath, recordingData.streamBaseName);
        await storage.markStreamCompleted(stream.id);
      } else {
        // Recording failed
        console.error(`Recording of stream ${stream.id} failed with code ${code}`);
        await storage.updateStreamStatus(stream.id, 'error', `التسجيل فشل (رمز الخطأ: ${code})`);
      }
    });
    
    recordingProcess.on('error', async (error) => {
      console.error(`Error in recording process for stream ${stream.id}:`, error);
      await storage.updateStreamStatus(stream.id, 'error', error.message);
      activeRecordings.delete(stream.id);
    });
  } catch (error) {
    console.error(`Error starting recording for stream ${stream.id}:`, error);
    await storage.updateStreamStatus(stream.id, 'error', error instanceof Error ? error.message : 'خطأ غير معروف');
  }
}

// Stop an active recording
export async function stopRecording(streamId: number): Promise<boolean> {
  const recordingData = activeRecordings.get(streamId);
  
  if (!recordingData) {
    console.log(`No active recording found for stream ${streamId}`);
    return false;
  }
  
  try {
    console.log(`Stopping recording for stream ${streamId}`);
    
    // Get the process
    const { process, outputPath, streamBaseName } = recordingData;
    
    // Gracefully terminate the process
    if (process.pid) {
      process.kill('SIGTERM');
      console.log(`Sent SIGTERM to process ${process.pid}`);
    }
    
    // Remove from active recordings map
    activeRecordings.delete(streamId);
    
    // Update stream status
    await storage.updateStreamStatus(streamId, 'completed');
    
    // Wait a bit for the file to be properly closed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Start segmentation process
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      await segmentVideo(streamId, outputPath, streamBaseName);
    }
    
    return true;
  } catch (error) {
    console.error(`Error stopping recording for stream ${streamId}:`, error);
    return false;
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
