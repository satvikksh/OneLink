import express from 'express';
import { Message } from '../models/message';

const router = express.Router();

/**
 * GET /messages/:chatId?limit=50&before=timestamp
 */
router.get('/:chatId', async (req, res) => {
  const chatId = req.params.chatId;
  const limit = Number(req.query.limit || 50);
  const before = req.query.before ? new Date(String(req.query.before)) : undefined;

  const q: any = { chatId };
  if (before) q.createdAt = { $lt: before };

  const messages = await Message.find(q).sort({ createdAt: 1 }).limit(limit);
  res.json(messages);
});

export default router;
