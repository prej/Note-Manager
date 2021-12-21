const { defer } = require("q");
const Q = require("q");
const ddb = require("../DDBConfig");

const tableName = "prerna_notebook";
const usertable = "prerna_user";

const notebookddb = (req, res, next)=>{
  var params = {
    TableName:tableName
  }
  ddb.scan(params, function (err, data) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    }else {
      console.log('data:',data);
      res.send(data);
    }
  });
}

const getAllNotebooks = (req, res, next) => {
  let userid = req.params.userid;

  getnotebookIDs().then((notebooks) => {
    if(notebooks.length===0){
      res.status(404).send('no notebooks');
      return;
    }
    const notebookList = notebooks.map((ele)=>{
        return {"notebookid":ele}
    })
    console.log("list of nt obj:", notebookList);
    var params = {
        RequestItems:{
          'prerna_notebook':{
                Keys: notebookList
            }
        }
    }
    ddb.batchGet(params, (err, data)=> {
        if (err) {
          console.log(err);
          res.send(err);
        }
        else {
          console.log("data from notebook table:", data);
          console.log(data.Responses.prerna_notebook);}
          res.send(data)
      })
  })
  .catch(err=>{
    if(err===404){ res.status(404).send('no user by this id');}
    if(err==='noNotebook') {res.status(404).send('no notebook for the user');}
    res.send(err);
  });

  function getnotebookIDs() {
    let defer = Q.defer();
    let userparam = {
      TableName: usertable,
      Key: {
        userid: userid,
      },
    };

    ddb.get(userparam, function (err, data) {
      if (err) {
      }else if(Object.keys(data).length === 0){
        console.log('user not fount');
        defer.reject(404)
      }  else {
        console.log("in get data:", data);
        defer.resolve(data.Item.notebookid);
      }
    });
    return defer.promise;
  }
};

const getNotebookByid = (req, res, next) => {
  var params = {
    TableName: tableName,
    Key: {
      notebookid: req.params.notebookid,
    },
  };

  ddb.get(params, function (err, data) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    } else if(Object.keys(data).length === 0){
      console.log('notebook not fount');
      res.status(404).send('No notebook found')
    } else {
      console.log(data);
      res.send(data);
    }
  });
};

const postNotebook = (req, res, next) => {
  Q.all([putNotebook(), updateUserNotebooks()]).then(function (value){
    console.log('promise values:',value[0]);
    res.send(value[0])
  }).catch(err=>{
    console.log(err);
    if(err==='noUser'){ res.status(404).send('no user found by this identity') }
    res.status(400).send(err)
  })
  function putNotebook(){
    var defer = Q.defer();
    var params = {
      TableName: tableName,
      Item: {
        notebookid: req.body.notebookid,
        notebookName: req.body.notebookName,
        notesid: req.body.notesid || [],
      },
      ConditionExpression: 'attribute_not_exists(notebookid)'
    };
    ddb.put(params, function (err, data) {
      if (err) {
        console.log(err);
        defer.reject();
      } else {
        console.log(data);
        defer.resolve(data);
      }
    });
    return defer.promise;
  }
  function updateUserNotebooks(){
    var defer = Q.defer();
    var userparam = {
      TableName: usertable,
      Key: {
        userid: req.params.userid,
      },
      UpdateExpression: "SET notebookid = list_append(notebookid, :vals)",
      ExpressionAttributeValues: {
        ":vals": [req.body.notebookid],
      },
      ReturnValues: "UPDATED_NEW",
    };
    ddb.update(userparam, function (err, data) {
      if (err) {
        console.log('update user err:',err);
        defer.reject('noUser')
      }else {
        console.log(data);
        defer.resolve();
      }
    });
    return defer.promise;
  }
};

const deleteNotebook = (req, res, next) => {
  let notebook = req.params.notebookid;

  getUserForNotebook(notebook, req.params.userid)
  .then(removeNotebookFromUser)
  .then(deleteNotebookFromDDB)
  .then(deleteNotes)
  .then(function(){
    res.send('data deleted')
  }).catch(err=>{
    res.status(400).send(err)
  });

  function deleteNotebookFromDDB(){
    var defer = Q.defer();
    let params = {
      Key: {
        notebookid: notebook,
      },
      TableName: tableName,
      ReturnValues: 'ALL_OLD'
    };
    ddb.delete(params, function (err, data) {
      if (err) {
        console.log(err);
        defer.reject(err);
      } else {
        console.log(data);
        defer.resolve(data.Attributes.notesid)
      }
    });
    return defer.promise;
  }
  function getUserForNotebook(notebook, user) {
    let deferred = Q.defer();
    let index = -1;
    ddb.get(
      {
        TableName: usertable,
        Key: {
          userid: user,
        },
      },
      function (err, data) {
        index = data.Item.notebookid.indexOf(notebook);
        deferred.resolve(index);
      }
    );
    return deferred.promise;
  }

  function removeNotebookFromUser(index){
    var defer = Q.defer();
    console.log("index:", index);
    var userparam = {
      TableName: usertable,
      Key: {
        userid: req.params.userid,
      },
      UpdateExpression: "REMOVE notebookid[" + index + "] ",
    };
    ddb.update(userparam, function (err, data) {
      if (err) {
        console.log(err);
        defer.reject(err);
      } else {
        console.log(data);
        defer.resolve();
      }
    });
    return defer.promise;
  }
  function deleteNotes(notes){
    const defer = Q.defer();
    console.log('notes:',notes);
    if(notes.lenght===0) defer.resolve();
    const notesList = notes.map(value=>{
        return {DeleteRequest:{Key:{"noteid":value}}}
    });
    var params = {
        RequestItems:{
            'prerna_note': notesList
        }
    }
    ddb.batchWrite(params, function(err, data){
        if (err) {
            console.log(err);
        }else {
            console.log("note data:",data);
            defer.resolve();
        }
    })
    return defer.promise;
  }
};

module.exports = {
  getAllNotebooks,
  getNotebookByid,
  postNotebook,
  deleteNotebook,
  notebookddb
};
