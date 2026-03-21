import { nanoid } from 'nanoid';
import { Sermon } from '../domain/Sermon.js';
import { ValidationError } from '../domain/errors/ValidationError.js';

/**
 * Upload Service
 * Handles sermon file uploads and metadata creation
 */
export class UploadService {
  constructor(sermonRepository, blobAdapter) {
    this.repository = sermonRepository;
    this.blob = blobAdapter;
  }

  /**
   * Create new sermon with audio file
   */
  async createSermon({ title, speaker, date, file, uploadedBy }) {
    // Validate file
    this.validateFile(file);

    // Create sermon ID
    const id = nanoid();

    // Store audio file
    const { storageKey } = await this.blob.putAudio({
      id,
      date,
      originalName: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
    });

    // Create sermon domain object
    const sermon = new Sermon({
      id,
      title,
      speaker,
      date,
      filename: file.originalname,
      storageKey,
      mimetype: file.mimetype,
      size: file.size,
      durationSeconds: null, // TODO: Extract from audio file
      uploadedBy,
    });

    // Persist to database
    await this.repository.create({
      id: sermon.id,
      title: sermon.title,
      speaker: sermon.speaker,
      date: sermon.date,
      filename: sermon.filename,
      storageKey: sermon.storageKey,
      mimetype: sermon.mimetype,
      size: sermon.size,
      durationSeconds: sermon.durationSeconds,
      createdAt: sermon.createdAt,
    });

    return sermon;
  }

  /**
   * Validate uploaded file
   */
  validateFile(file) {
    if (!file) {
      throw new ValidationError('No file provided');
    }

    // Check MIME type
    if (!file.mimetype.startsWith('audio/')) {
      throw new ValidationError('Only audio files are allowed');
    }

    // Check file size (200MB max)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ValidationError('File size cannot exceed 200MB');
    }

    return true;
  }
}
