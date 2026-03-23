import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Sermon Controller
 * Handles HTTP requests for sermon endpoints
 */
export class SermonController {
  constructor(sermonService, blobAdapter) {
    this.sermonService = sermonService;
    this.blob = blobAdapter;
  }

  /**
   * GET /api/sermons
   * List all sermons with optional filtering
   */
  listSermons = asyncHandler(async (req, res) => {
    const { q, speaker, mosque, sort } = req.query;
    const items = await this.sermonService.listSermons({ q, speaker, mosque, sort });
    res.json({ items });
  });

  /**
   * GET /api/speakers
   */
  listSpeakers = asyncHandler(async (req, res) => {
    const speakers = await this.sermonService.getSpeakers();
    res.json({ speakers });
  });

  /**
   * GET /api/mosques
   */
  listMosques = asyncHandler(async (req, res) => {
    const mosques = await this.sermonService.getMosques();
    res.json({ mosques });
  });

  /**
   * GET /api/sermons/:id/stream
   * Stream sermon audio file
   */
  streamSermon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const sermon = await this.sermonService.getSermon(id);
    
    // Delegate streaming to blob adapter
    await this.blob.streamAudio(req, res, sermon);
  });
}
