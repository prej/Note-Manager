const express = require('express')
const router = express.Router();
const userHandler = require('../handlers/userHandler')

router.get('/', userHandler.getAllUsers)
router.get('/:userid', userHandler.getUserByID)
router.post('/', userHandler.postUser)
router.delete('/:userid', userHandler.deleteUser)

module.exports = router;