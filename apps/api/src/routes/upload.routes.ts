import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /upload
 * @desc    Upload a single file
 * @access  Private
 */
router.post('/', authenticate, upload.single('file'), (req: Request, res: Response) => {
    // Cast req to any to avoid TypeScript error with multer types
    const file = (req as any).file;

    if (!file) {
        res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
        return;
    }

    res.json({
        success: true,
        data: {
            url: file.path,
            public_id: file.filename,
        }
    });
});

export default router;
