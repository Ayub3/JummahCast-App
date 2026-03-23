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
    const { title, speaker, date, description } = req.body;
    const file = req.file;
    const uploadedBy = req.user?.id;
    // Tag sermon with the admin's mosque automatically
    const mosque = req.user?.mosque ?? null;

    const sermon = await this.uploadService.createSermon({
      title,
      speaker,
      date,
      description,
      file,
      uploadedBy,
      mosque,
    });

    res.status(201).json({
      ok: true,
      data: sermon.toJSON(),
      message: 'Sermon uploaded successfully',
    });
  });
}
