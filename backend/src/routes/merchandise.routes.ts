import { Router } from 'express';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getOrders, updateOrderStatus,
} from '../controllers/merchandise.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/:eventId/merchandise/products', requireAuth, getProducts);
router.post('/:eventId/merchandise/products', requireAuth, createProduct);
router.put('/:eventId/merchandise/products/:id', requireAuth, updateProduct);
router.patch('/:eventId/merchandise/products/:id', requireAuth, updateProduct);
router.delete('/:eventId/merchandise/products/:id', requireAuth, deleteProduct);
router.get('/:eventId/merchandise/orders', requireAuth, getOrders);
router.patch('/:eventId/merchandise/orders/:id/status', requireAuth, updateOrderStatus);

export default router;
