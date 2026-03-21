import { Sermon } from '../domain/Sermon.js';
import { NotFoundError } from '../domain/errors/NotFoundError.js';

/**
 * Sermon Service
 * Business logic for sermon management
 */
export class SermonService {
  constructor(sermonRepository) {
    this.repository = sermonRepository;
  }

  /**
   * List sermons with filtering and sorting
   */
  async listSermons({ q, speaker, sort } = {}) {
    const sermons = await this.repository.findAll({ q, speaker, sort });
    return sermons;
  }

  /**
   * Get single sermon by ID
   */
  async getSermon(id) {
    const sermon = await this.repository.findById(id);
    
    if (!sermon) {
      throw new NotFoundError('Sermon not found');
    }

    return sermon;
  }

  /**
   * Get list of unique speakers
   */
  async getSpeakers() {
    return this.repository.listUniqueSpeakers();
  }
}
