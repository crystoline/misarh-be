import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  getProductById,
} from '../controllers/products.controller';

const router = Router();

/**
 * @route   GET /products
 * @desc    Get all products with filters
 * @access  Public
 */
router.get('/', getProducts);

/**
 * @route   GET /products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
router.get('/slug/:slug', getProductBySlug);

/**
 * @route   GET /products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', getProductById);

export default router;
