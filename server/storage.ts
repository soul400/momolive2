import { users, type User, type InsertUser, streams, type Stream, type InsertStream, segments, type Segment, type InsertSegment } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Stream methods
  createStream(stream: InsertStream): Promise<Stream>;
  getStream(id: number): Promise<Stream | undefined>;
  getAllStreams(): Promise<Stream[]>;
  updateStreamStatus(id: number, status: string, errorMessage?: string): Promise<Stream | undefined>;
  markStreamCompleted(id: number): Promise<Stream | undefined>;
  
  // Segment methods
  createSegment(segment: InsertSegment): Promise<Segment>;
  getSegmentsByStreamId(streamId: number): Promise<Segment[]>;
  getAllSegments(limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<Segment[]>;
  getSegment(id: number): Promise<Segment | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private streams: Map<number, Stream>;
  private segments: Map<number, Segment>;
  private currentUserId: number;
  private currentStreamId: number;
  private currentSegmentId: number;

  constructor() {
    this.users = new Map();
    this.streams = new Map();
    this.segments = new Map();
    this.currentUserId = 1;
    this.currentStreamId = 1;
    this.currentSegmentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Stream methods
  async createStream(insertStream: InsertStream): Promise<Stream> {
    const id = this.currentStreamId++;
    const now = new Date();
    const stream: Stream = { 
      ...insertStream, 
      id, 
      status: "pending", 
      startedAt: now,
      completedAt: null,
      errorMessage: null,
    };
    this.streams.set(id, stream);
    return stream;
  }

  async getStream(id: number): Promise<Stream | undefined> {
    return this.streams.get(id);
  }

  async getAllStreams(): Promise<Stream[]> {
    return Array.from(this.streams.values());
  }

  async updateStreamStatus(id: number, status: string, errorMessage?: string): Promise<Stream | undefined> {
    const stream = this.streams.get(id);
    if (!stream) return undefined;
    
    const updatedStream: Stream = {
      ...stream,
      status,
      errorMessage: errorMessage || stream.errorMessage,
    };
    
    this.streams.set(id, updatedStream);
    return updatedStream;
  }

  async markStreamCompleted(id: number): Promise<Stream | undefined> {
    const stream = this.streams.get(id);
    if (!stream) return undefined;
    
    const updatedStream: Stream = {
      ...stream,
      status: "completed",
      completedAt: new Date(),
    };
    
    this.streams.set(id, updatedStream);
    return updatedStream;
  }

  // Segment methods
  async createSegment(insertSegment: InsertSegment): Promise<Segment> {
    const id = this.currentSegmentId++;
    const now = new Date();
    const segment: Segment = {
      ...insertSegment,
      id,
      createdAt: now,
    };
    this.segments.set(id, segment);
    return segment;
  }

  async getSegmentsByStreamId(streamId: number): Promise<Segment[]> {
    return Array.from(this.segments.values())
      .filter(segment => segment.streamId === streamId)
      .sort((a, b) => a.position - b.position);
  }

  async getAllSegments(limit?: number, sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc'): Promise<Segment[]> {
    const allSegments = Array.from(this.segments.values());
    
    // Sort segments
    const sortedSegments = allSegments.sort((a, b) => {
      if (sortBy === 'createdAt') {
        return sortOrder === 'desc' 
          ? b.createdAt.getTime() - a.createdAt.getTime()
          : a.createdAt.getTime() - b.createdAt.getTime();
      } else if (sortBy === 'position') {
        return sortOrder === 'desc' 
          ? b.position - a.position
          : a.position - b.position;
      }
      return 0;
    });
    
    // Apply limit if specified
    if (limit && limit > 0) {
      return sortedSegments.slice(0, limit);
    }
    
    return sortedSegments;
  }

  async getSegment(id: number): Promise<Segment | undefined> {
    return this.segments.get(id);
  }
}

export const storage = new MemStorage();
