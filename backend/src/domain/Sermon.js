import { ValidationError } from './errors/ValidationError.js';

/**
 * Sermon Domain Entity
 */
export class Sermon {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.speaker = data.speaker;
    this.date = data.date;
    this.filename = data.filename;
    this.storageKey = data.storageKey;
    this.mimetype = data.mimetype;
    this.size = data.size;
    this.durationSeconds = data.durationSeconds || null;
    this.mosque = data.mosque || null;
    this.description = data.description || null;
    this.uploadedBy = data.uploadedBy || null;
    this.createdAt = data.createdAt || new Date().toISOString();

    this.validate();
  }

  validate() {
    if (!this.title || this.title.trim().length === 0)
      throw new ValidationError('Title is required');
    if (this.title.length > 200)
      throw new ValidationError('Title cannot exceed 200 characters');
    if (!this.speaker || this.speaker.trim().length === 0)
      throw new ValidationError('Speaker is required');
    if (this.speaker.length > 100)
      throw new ValidationError('Speaker name cannot exceed 100 characters');
    if (!this.date || !this.isValidDate(this.date))
      throw new ValidationError('Invalid date format. Expected YYYY-MM-DD');
    if (this.size && this.size > 200 * 1024 * 1024)
      throw new ValidationError('File size cannot exceed 200MB');
  }

  isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      speaker: this.speaker,
      date: this.date,
      filename: this.filename,
      mimetype: this.mimetype,
      size: this.size,
      durationSeconds: this.durationSeconds,
      mosque: this.mosque,
      description: this.description,
      uploadedBy: this.uploadedBy,
      createdAt: this.createdAt,
    };
  }

  toPublicJSON() {
    const json = this.toJSON();
    delete json.storageKey;
    return json;
  }
}

