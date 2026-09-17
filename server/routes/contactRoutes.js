const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { contactRateLimiter } = require('../middleware/rateLimiter');

router.post('/', contactRateLimiter, contactController.submitContact);
router.get('/', contactController.getContacts);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
