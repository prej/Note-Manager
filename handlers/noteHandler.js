const ddb = require('../DDBConfig')
const Q = require('q');
const { defer, resolve } = require('q');

const USER_TABLE = "prerna_user";
const NOTEBOOK_TABLE = "prerna_notebook";
const NOTE_TBALE = "prerna_note";

function getAllNotes(req, res, next){
    
    getFromNotebook()
    .then(getNotes)
    .then(()=>{
      res.send('notebook deleted');
    })
    .catch(err=>{
        console.log(err);
    })

    function getFromNotebook(){
        const defer = Q.defer();
        const params = {
            TableName: NOTEBOOK_TABLE,
            Key:{
                notebookid: req.params.notebookid
            }
        };
        ddb.get(params, (err, data)=>{
            if(err){
                console.log(err);
                defer.reject();
            }else{
                console.log("get from notebook:", data);
                defer.resolve(data.Item.notesid);
            }
        });
        return defer.promise;
    }
    function getNotes(notes){
      var defer = Q.defer();
      if(notes.length===0) defer.resolve();
      const notesList = notes.map((value)=>{
          return {"noteid":value};
      })
      const params = {
          RequestItems :{
              'prerna_note':{
                  Keys:notesList
              }
          }
      }
      ddb.batchGet(params, (err, data)=>{
          if(err){
              console.log(err);
              defer.reject(err);
          }else{
          console.log("get notes:", data);
          defer.resolve()
          }
      });
      return defer.promise;
    }
}
const getNotesByid = (req, res, next)=>{
    const params = {
        TableName: NOTE_TBALE,
        Key:{
            noteid: req.params.noteid
        }
    };
    ddb.get(params, (err, data)=>{
        if(err){
            console.log(err);
        }else if(Object.keys(data).length === 0){
          console.log('note not fount');
          res.status(404).send('not a note')
        }else{
        console.log("get note by id:", data);
        res.send(data);
        }
    })
}

const postNote = (req, res, next) =>{

  Q.all([updateNotebookNotes(),putNoteInDDB()])
  .then(()=>{
    console.log('promise values:',value[0]);
    res.send(value[0])
  })
  .catch(err=>{
    if(err==='noNotebook'){ res.status(404).send('no notebook found by this identity') }
    res.status(400).send(err)
  });
  function putNoteInDDB(){
    var defer = Q.defer();
    const params = {
        TableName: NOTE_TBALE,
        Item:{
            noteid: req.body.noteid,
            noteName: req.body.noteName,
            note: req.body.note
        }
    }
    ddb.put(params, function (err, data) {
        if(err){
            console.log(err);
            defer.reject();
        }else{
            console.log('post note:',data);
            defer.resolve();
        }
    });
    return defer.promise;
  }
  function updateNotebookNotes(){
    var defer = Q.defer();
    const notebookParams = {
      TableName: NOTEBOOK_TABLE,
      Key: {
        notebookid: req.params.notebookid,
      },
      UpdateExpression: "SET notesid = list_append(notesid, :vals)",
      ExpressionAttributeValues: {
        ":vals": [req.body.noteid],
      },
      ReturnValues: "UPDATED_NEW"
    }
    ddb.update(notebookParams, function (err, data) {
      if (err) {
        console.log(err);
        defer.reject('noNotebook');
      } else {
        console.log('data',data);
        defer.resolve(data)
      }
    });
    return defer.promise;
  }
}

const deleteNote = (req, res, next)=>{

    let note = req.params.noteid;

    getNoteFromNotebook()
  .then(deleteNoteFromNotebook)
  .then(deleteNoteFromDDB)
  .then(()=>{
    res.send('note deleted')
  })
  .catch(err=>{
    res.status(400).send(err)
  });
  function deleteNoteFromDDB(){
    var defer = Q.defer();
    let params = {
      Key: {
        noteid: note,
      },
      TableName: NOTE_TBALE,
    };
    ddb.delete(params, function (err, data) {
      if (err) {
        console.log(err);
        defer.reject();
      } else {
        console.log(data);
        defer.resolve();
      }
    });
    return defer.promise;
  }
  

  function deleteNoteFromNotebook(index) {
    var defer = Q.defer();
    console.log("index:", index);
    if(index===-1){
      defer.reject()
    }
    var userparam = {
      TableName: NOTEBOOK_TABLE,
      Key: {
        notebookid: req.params.notebookid,
      },
      UpdateExpression: "REMOVE notesid[" + index + "] ",
    };
    ddb.update(userparam, function (err, data) {
      if (err) {
        console.log(err);
        defer.reject()
      } else {
        console.log(data);
        defer.resolve(data);
      }
    });
    return defer.promise;
  };

  function getNoteFromNotebook() {
    let deferred = Q.defer();
    let index = -1;
    ddb.get(
      {
        TableName: NOTEBOOK_TABLE,
        Key: {
          notebookid: req.params.notebookid,
        },
      },
      function (err, data) {
        if(err){
          defer.reject();
        }else{
          index = data.Item.notesid.indexOf(note);
          deferred.resolve(index);
        }
      }
    );
    return deferred.promise;
  }
}

const updateNote = (req, res, next)=>{
  var params = {
    TableName: NOTE_TBALE,
    Key:{
      noteid: req.params.noteid
    },
    UpdateExpression: 'SET note = :val',
    ExpressionAttributeValues:{
      ':val' : req.body.note
    },
    ReturnValues:'ALL_NEW'
  }
  ddb.update(params, function(err, data){
    if(err){
      console.log(err);
      res.status(400).send(err);
    }else{
      console.log(data);
      res.send(data)
    }
  })
}

module.exports = {
    getAllNotes,
    getNotesByid,
    postNote,
    deleteNote,
    updateNote
}