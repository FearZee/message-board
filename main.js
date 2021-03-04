const express = require('express')
const {readFile, writeFile, existsSync} = require('fs')
const path = require('path')
const exphbs  = require('express-handlebars');
const CHANNEL_DIR = path.join(__dirname, 'channels');
const USER_DIR = path.join(__dirname, 'users');
const FILE_OPTIONS = {encoding:'utf8'};

const app = express()
const port = 8080

let names = []

let channelFileName = path.join(CHANNEL_DIR, `general.json`);
let userFileName = path.join(USER_DIR, `general.json`)

let testName = 'general';

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use('/static', express.static( './public'));
app.use(express.urlencoded());

app.get('/', (request, response) => {
    response.redirect(`/channel/${testName}`);
})

app.get('/channel/:channelName', (request, response) => {

    const {channelName} = request.params;

    testName = channelName;

    channelFileName = path.join(CHANNEL_DIR, `${channelName}.json`);

    if(!existsSync(channelFileName)){
        response.status(404).end();
        return
    }

    readFile(
        channelFileName,
        FILE_OPTIONS,
        (error, text) => {
            if(error){
                response.status(500).end();
            }
            const channel = JSON.parse(text);
            response.render('home', {channel})
        })
})

app.post('/messages/new', (request, response) => {

    const {author, text} = request.body;
    const message = {
        author,
        text
    }

    if(!existsSync(channelFileName)){
        response.status(404).end();
        return
    }

    readFile(
        channelFileName,
        FILE_OPTIONS,
        (error, text) => {
            if(error){
                response.status(500).end();
                return
            }
            let channel = JSON.parse(text);
            channel.messages.unshift(message);

            writeFile(channelFileName, JSON.stringify(channel, null, 2), FILE_OPTIONS, (error)=> {
                if(error){
                    response.status(500).end();
                } else {
                    response.redirect(`/`);
                }
            })
        })
})

app.listen(port,() => {
    console.log(`Example app listening at http://localhost:${port}`)
})