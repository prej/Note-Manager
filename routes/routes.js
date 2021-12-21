const express = require('express')
const router = express.Router();
const userHandler = require('../handlers/userHandler')
const notebookHandler = require('../handlers/notebookHandler');
const notesHandler = require('../handlers/noteHandler')

//user routes
router.get('/user', userHandler.getAllUsers)
router.get('/user/:userid', userHandler.getUserByID)
router.post('/user', userHandler.postUser)
router.delete('/user/:userid', userHandler.deleteUser)
router.get('/user/title/:title', userHandler.searchByTitle)

//notebook routes
router.get('/user/:userid/notebook', notebookHandler.getAllNotebooks)
router.get('/user/:userid/notebook/:notebookid', notebookHandler.getNotebookByid)
router.post('/user/:userid/notebook', notebookHandler.postNotebook)
router.delete('/user/:userid/notebook/:notebookid', notebookHandler.deleteNotebook)

router.get('/notebook', notebookHandler.notebookddb)

//note routes
router.get('/user/:userid/notebook/:notebookid/note', notesHandler.getAllNotes)
router.get('/user/:userid/notebook/:notebookid/note/:noteid', notesHandler.getNotesByid)
router.post('/user/:userid/notebook/:notebookid/note',notesHandler.postNote)
router.delete('/user/:userid/notebook/:notebookid/note/:noteid', notesHandler.deleteNote)
router.put('/user/:userid/notebook/:notebookid/note/:noteid', notesHandler.updateNote)

module.exports = router;