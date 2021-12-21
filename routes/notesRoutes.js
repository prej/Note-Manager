const express = require('express')
const router = express.Router();
const notesHandler = require('../handlers/noteHandler')

router.get('/', notesHandler.getAllNotes)
router.get('/:noteid', notesHandler.getNotesByid)
router.post('/',notesHandler.postNote)
router.delete('/:noteid', notesHandler.deleteNote)
module.exports = router;

