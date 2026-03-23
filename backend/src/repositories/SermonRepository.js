/**
 * Sermon Repository
 * Data access layer for sermons
 */
export class SermonRepository {
  constructor(dbAdapter) {
    this.db = dbAdapter;
  }

  async findAll({ q, speaker, mosque, sort } = {}) {
    return this.db.listSermons({ q, speaker, mosque, sort });
  }

  async findById(id) {
    return this.db.getSermonById(id);
  }

  async create(sermonData) {
    return this.db.insertSermon(sermonData);
  }

  async listUniqueSpeakers() {
    return this.db.listSpeakers();
  }

  async listUniqueMosques() {
    if (typeof this.db.listMosques === 'function') {
      return this.db.listMosques();
    }
    return [];
  }
}
