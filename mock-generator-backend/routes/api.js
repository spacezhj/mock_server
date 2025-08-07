import express from 'express';
const router = express.Router();
import schemaController from '../controllers/schemaController.js';

// Schema相关路由
router.post('/schemas', schemaController.create);
router.get('/schemas', schemaController.getAll);
router.get('/schemas/:id', schemaController.getById);
router.put('/schemas/:id', schemaController.update);
router.delete('/schemas/:id', schemaController.deleteSchema);
router.get('/schemas/:id/data', schemaController.getData);

export default router;