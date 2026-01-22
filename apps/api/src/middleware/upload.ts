import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'misarh',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    } as any,
});

export const upload = multer({ storage: storage });
