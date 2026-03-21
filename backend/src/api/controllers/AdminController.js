import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Admin Controller
 * Handles admin-specific operations (protected)
 */
export class AdminController {
  constructor(uploadService) {
    this.uploadService = uploadService;
  }

  /**
   * POST /api/admin/upload
   * Upload new sermon (admin only)
   */
  uploadSermon = asyncHandler(async (req, res) => {
    const { title, speaker, date } = req.body;
    const file = req.file;
    const uploadedBy = req.user?.id;

    const sermon = await this.uploadService.createSermon({
      title,
      speaker,
      date,
      file,
      uploadedBy,
    });

    res.status(201).json({
      ok: true,
      data: sermon.toJSON(),
      message: 'Sermon uploaded successfully',
    });
  });
}
