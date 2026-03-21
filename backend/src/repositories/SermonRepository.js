/**
 * Sermon Repository
 * Data access layer for sermons
 */
export class SermonRepository {
  constructor(dbAdapter) {
    this.db = dbAdapter;
  }

  async findAll({ q, speaker, sort } = {}) {
    return this.db.listSermons({ q, speaker, sort });
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
}
