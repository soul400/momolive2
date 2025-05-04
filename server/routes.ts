import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { insertStreamSchema } from '@shared/schema';
import { recordStream, stopRecording, activeRecordings } from './ffmpeg-utils';

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'uploads');
  const segmentsDir = path.join(uploadDir, 'segments');
  const thumbnailsDir = path.join(uploadDir, 'thumbnails');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  if (!fs.existsSync(segmentsDir)) {
    fs.mkdirSync(segmentsDir, { recursive: true });
  }
  
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }
  
  // Serve static files from uploads folder
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Content-Disposition', 'inline');
    next();
  });
  
  app.use('/uploads', express.static(uploadDir));
  
  // API routes
  // 1. Start stream recording
  app.post('/api/streams', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertStreamSchema.parse(req.body);
      
      // Check if the URL is from jaco.live
      if (!validatedData.url.includes('jaco.live')) {
        return res.status(400).json({ message: 'يجب أن يكون الرابط من موقع jaco.live' });
      }
      
      // Create stream record
      const stream = await storage.createStream(validatedData);
      
      // Start recording in the background
      recordStream(stream).catch(err => {
        console.error('Recording error:', err);
      });
      
      res.status(201).json(stream);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'بيانات غير صالحة', errors: error.errors });
      }
      console.error('Stream creation error:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء معالجة الطلب' });
    }
  });
  
  // 2. Get all streams
  app.get('/api/streams', async (_req: Request, res: Response) => {
    try {
      const streams = await storage.getAllStreams();
      res.status(200).json(streams);
    } catch (error) {
      console.error('Get streams error:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء جلب البيانات' });
    }
  });
  
  // 3. Get stream by ID
  app.get('/api/streams/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'معرف غير صالح' });
      }
      
      const stream = await storage.getStream(id);
      if (!stream) {
        return res.status(404).json({ message: 'لم يتم العثور على البث' });
      }
      
      res.status(200).json(stream);
    } catch (error) {
      console.error('Get stream error:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء جلب بيانات البث' });
    }
  });
  
  // 4. Get all segments with optional filtering
  app.get('/api/segments', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
      
      const segments = await storage.getAllSegments(limit, sortBy, sortOrder);
      res.status(200).json(segments);
    } catch (error) {
      console.error('Get segments error:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء جلب المقاطع' });
    }
  });
  
  // 5. Get segments by stream ID
  app.get('/api/streams/:id/segments', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'معرف غير صالح' });
      }
      
      const stream = await storage.getStream(id);
      if (!stream) {
        return res.status(404).json({ message: 'لم يتم العثور على البث' });
      }
      
      const segments = await storage.getSegmentsByStreamId(id);
      res.status(200).json(segments);
    } catch (error) {
      console.error('Get stream segments error:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء جلب مقاطع البث' });
    }
  });
  
  // 6. Get segment by ID
  app.get('/api/segments/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'معرف غير صالح' });
      }
      
      const segment = await storage.getSegment(id);
      if (!segment) {
        return res.status(404).json({ message: 'لم يتم العثور على المقطع' });
      }
      
      res.status(200).json(segment);
    } catch (error) {
      console.error('Get segment error:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء جلب بيانات المقطع' });
    }
  });
  
  // 7. Stop recording
  app.post('/api/streams/:id/stop', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'معرف غير صالح' });
      }
      
      const stream = await storage.getStream(id);
      if (!stream) {
        return res.status(404).json({ message: 'لم يتم العثور على البث' });
      }
      
      // Check if recording is active
      if (!activeRecordings.has(id)) {
        return res.status(400).json({ message: 'البث غير نشط حالياً' });
      }
      
      // Stop the recording
      const success = await stopRecording(id);
      
      if (success) {
        res.status(200).json({ message: 'تم إيقاف التسجيل بنجاح' });
      } else {
        res.status(500).json({ message: 'فشل إيقاف التسجيل' });
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء إيقاف التسجيل' });
    }
  });

  // 8. Get active recordings status
  app.get('/api/recordings/active', async (_req: Request, res: Response) => {
    try {
      const activeIds = Array.from(activeRecordings.keys());
      const activeStreams = [];
      
      for (const id of activeIds) {
        const stream = await storage.getStream(id);
        if (stream) {
          activeStreams.push(stream);
        }
      }
      
      res.status(200).json(activeStreams);
    } catch (error) {
      console.error('Get active recordings error:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء جلب التسجيلات النشطة' });
    }
  });

  // 9. Download segment
  app.get('/api/segments/:id/download', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'معرف غير صالح' });
      }
      
      const segment = await storage.getSegment(id);
      if (!segment) {
        return res.status(404).json({ message: 'لم يتم العثور على المقطع' });
      }
      
      // Check if file exists
      if (!fs.existsSync(segment.filePath)) {
        return res.status(404).json({ message: 'ملف المقطع غير موجود' });
      }
      
      res.download(segment.filePath, segment.fileName);
    } catch (error) {
      console.error('Download segment error:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء تحميل المقطع' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Import express since we use it in the middleware
import express from 'express';
