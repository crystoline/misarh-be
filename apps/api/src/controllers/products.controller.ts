import { Request, Response } from 'express';
import { query } from '../config/database';
import { Product, ProductListQuery, Paginated } from '@misarh/shared';

/**
 * @route   GET /products
 * @desc    Get all products with filtering and pagination
 * @access  Public
 */
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      family,
      min_price,
      max_price,
      search,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query as unknown as ProductListQuery;

    let queryText = 'SELECT * FROM products WHERE is_active = true';
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Filter by family
    if (family) {
      queryText += ` AND family = $${paramIndex}`;
      queryParams.push(family);
      paramIndex++;
    }

    // Filter by price range
    if (min_price) {
      queryText += ` AND base_price >= $${paramIndex}`;
      queryParams.push(min_price);
      paramIndex++;
    }

    if (max_price) {
      queryText += ` AND base_price <= $${paramIndex}`;
      queryParams.push(max_price);
      paramIndex++;
    }

    // Search by name or description
    if (search) {
      queryText += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        queryText += ' ORDER BY base_price ASC';
        break;
      case 'price_desc':
        queryText += ' ORDER BY base_price DESC';
        break;
      case 'popular':
        queryText += ' ORDER BY stock_level DESC';
        break;
      case 'newest':
      default:
        queryText += ' ORDER BY created_at DESC';
        break;
    }

    // Get total count (remove ORDER BY for count query)
    const countQuery = queryText.replace('SELECT *', 'SELECT COUNT(*)').split('ORDER BY')[0];
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    const response: Paginated<Product> = {
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        total_pages: Math.ceil(total / Number(limit)),
      },
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch products' },
    });
  }
};

/**
 * @route   GET /products/:slug
 * @desc    Get single product by slug
 * @access  Public
 */
export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const result = await query(
      'SELECT * FROM products WHERE slug = $1 AND is_active = true',
      [slug]
    );

    if (!result.rowCount || result.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
      });
      return;
    }

    const product = result.rows[0];

    // Get related products (same family, different product)
    const relatedResult = await query(
      `SELECT * FROM products 
       WHERE family = $1 AND slug != $2 AND is_active = true 
       LIMIT 3`,
      [product.family, slug]
    );

    res.status(200).json({
      success: true,
      data: {
        product,
        related_products: relatedResult.rows,
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch product' },
    });
  }
};

/**
 * @route   GET /products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (!result.rowCount || result.rowCount === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'Product not found', code: 'PRODUCT_NOT_FOUND' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch product' },
    });
  }
};
