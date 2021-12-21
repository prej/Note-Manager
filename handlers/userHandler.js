const ddb = require('../DDBConfig');
const Q = require('q');
const req = require('express/lib/request');
const { defer } = require('q');
const { getAllNotebooks } = require('./notebookHandler');
const { promise } = require('q');

const tableName = "prerna_user";

const getAllUsers = (req, res, next)=>{
    let params = {
        TableName: tableName
    }
    ddb.scan(params,(err, data)=>{
        if(err){
            console.log(err);
            res.send(err)
        }else{
            console.log('data:',data);
            res.send(data);

        }
    })
}

const getUserByID = (req, res, next)=>{
    var userid = req.params.userid;
    console.log('get user by id:',userid);
    var params = {
        TableName : tableName,
        Key: {
          userid: req.params.userid
        }
      };
            
      ddb.get(params, function(err, data) {
        if (err){ 
            console.log(err);
            res.send(err)
        }else if(Object.keys(data).length === 0){
            console.log('user not fount');
            res.status(404).send('not a user')
        }
        else {
            console.log('data:',data);
            res.send(data)
        }
    });
}

const postUser = (req, res, next) =>{
    console.log("post user reqbody:",req.body);
    var params = {
        TableName: tableName,
        Item:{
            userid:req.body.userid,
            userName: req.body.userName,
            notebookid: req.body.notebookid || []
        },
        ConditionExpression: 'attribute_not_exists(userid)'
    };

    ddb.put(params, function (err, data) {
        if(err){
            console.log(err);
            res.status(400).send(err)
        }else{
            console.log('data',data);
            res.status(201).send(data)
        }
    });
}

const deleteUser = (req, res, next) =>{
    deleteUserFromDDB()
    .then(getAllNotes)
    .then(deleteFromDDB)
    .then(()=>{
        res.send('user deleted');
    })
    .catch(err=>{
        if(err==='noUser'){
            res.status(204).send('no user like this')
        }
        console.log("error:", err);
    })

    function deleteUserFromDDB(){
        var defer = Q.defer()
        let params = {
            Key:{
                userid:req.params.userid    
            },
            ReturnValues: "ALL_OLD",
            TableName:tableName
        }
        ddb.delete(params,function(err, data){
            if(err){
                defer.reject(err)
            }else if(Object.keys(data).length === 0){
                defer.reject('noUser');
            }else{
                console.log("user data:",data);
                console.log('.............');
                defer.resolve(data.Attributes.notebookid);
            }
        })
        return defer.promise;
    }
    function getAllNotes(notebooks){
        var defer = Q.defer();
        if(notebooks.lenght===0){
            defer.resolve();
        }
        const notebookList = notebooks.map(value=>{
            return {'notebookid':value}
        });
        var params = {
            RequestItems:{
              'prerna_notebook':{
                    Keys: notebookList
                }
            }
        }
        ddb.batchGet(params, (err, data)=> {
            if (err) {console.log(err);}
            else {
              const notesList = data.Responses.prerna_notebook.reduce((accumlator, current)=>{
                var ids = current.notesid || [];
                accumlator.push(...ids);
                return accumlator;
              }, []);
              console.log('notesList:', notesList);
              console.log('.............');
              defer.resolve({'notebooks':notebooks, 'notesList':notesList})
            }
        });
        return defer.promise;
    }
    function deleteFromDDB(list) {
        const defer = Q.defer();
        Q.all([deleteNotebooks(list.notebooks), deleteNotes(list.notesList)]).done(function (values){
            console.log(values);
        });
        return defer.promise;
    }
    function deleteNotebooks(notebooks){
        const defer = Q.defer();
        if(notebooks.lenght===0) defer.resolve();
        const notebookList = notebooks.map((value)=>{
            return {DeleteRequest:{Key:{"notebookid":value}}}
        });
        console.log("notebookList:", notebookList[0].DeleteRequest.Key);
        var params = {
            RequestItems:{
                'prerna_notebook':notebookList
            }
        }
        ddb.batchWrite(params, function(err, data) {
            if (err) {
                console.log(err);
            }else {
                console.log("notebook data:",data);
                console.log('.............');
                
                defer.resolve(notesList);
            }
          });
        return defer.promise;
    }
    function deleteNotes(notes){
        const defer = Q.defer();
        if(notes.lenght===0) defer.resolve();
        console.log('notes:',notes);
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
    
}

const searchByTitle = (req, res, next)=> {

    var params = {
        TableName:'prerna_user',
        FilterExpression: "userName = :name",
        ExpressionAttributeValues: {
            ":name":req.params.title
        }
    }
    ddb.scan(params, function(err, data) {
        if (err){ 
            console.log(err);
            res.status(404).send(err)
        }else if(Object.keys(data.Items).length === 0){
            console.log('user not fount');
            res.status(404).send('not a user')
        }else {
            console.log('data:',data);
            res.send(data)
        }
    });
}

module.exports={
    getAllUsers,
    getUserByID,
    postUser,
    deleteUser,
    searchByTitle
}

