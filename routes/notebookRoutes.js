const express = require('express')
const notebookHandler = require('../handlers/notebookHandler');
const router = express.Router();

router.get('/user/:userid', notebookHandler.getAllNotebooks)
router.get('/:notebookid', notebookHandler.getNotebookByid)
router.post('/', notebookHandler.postNotebook)
router.delete('/:notebookid/user/:userid', notebookHandler.deleteNotebook)

router.get('/all', notebookHandler.notebookddb)

module.exports = router;
