const express = require('express')
const app = express();
const userRoutes = require('./routes/userRoutes')
const notebookRoutes = require('./routes/notebookRoutes')
const notesRoutes = require('./routes/notesRoutes')
const routes = require('./routes/routes')
app.use(express.json())

app.use('/', routes)
// app.use('/user',userRoutes);
// app.use('/notebook',notebookRoutes);
// app.use('/user/:userid/notebook/:notebookid/notes',notesRoutes);

app.listen(3000, ()=>{
    console.log('server started...');
})