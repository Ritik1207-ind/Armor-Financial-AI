const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');
const upload = require('../middleware/upload.middleware');

router.post('/analyze', upload.single('audio_file'), conversationController.analyzeConversation);
router.get('/history', conversationController.getHistory);
router.get('/:id', conversationController.getConversation);
router.patch('/:id/transcript', conversationController.editTranscript);
router.delete('/:id', conversationController.deleteConversation);

module.exports = router;
