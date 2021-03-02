const express = require('express');
const {readFile, writeFile, existsSync} = require('fs');
const path = require('path');
const exphbs  = require('express-handlebars');
const FILE_NAME = 'messages.json';
const app = express()
const port = 3000

const CHANNEL_DIR = (__dirname,'channels');

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use('/static', express.static('./public'))
app.use(express.urlencoded())

let JSONFile = (__dirname,'channels');

//let messages = [];
isGeneral = false;
isChannel1 = false;

app.post('/send', (req, res) => {

    const{
        name = '',
        text = ''
    } = req.body

    messages.unshift({name,text})

    res.render('home',{messages})
})

app.post('/messages/new', (req, res) => {
    const{
        name = '',
        text = ''
    } = req.body

    const message = {name,text};

    readFile(path.join(__dirname,'channels', JSONFile),{encoding:'utf-8'}, (error,text) =>{
        if(error){
            res.status(500).end();
            return;
        }
        const messages = JSON.parse(text);
        messages.unshift(message);

        writeFile(path.join(__dirname, 'channels', JSONFile), JSON.stringify(messages),{encoding:'utf-8'}, (error) => {
            if(error)
                res.status(500).end();
            else if(isGeneral)
                res.redirect('/choose/general');
            else if(isChannel1)
                res.redirect('/choose/channel1');
            else
                res.redirect('/');
        })
    })
})

app.get('/', (req, res) => {

    isGeneral = false;
    isChannel1 = false;
    ChannelChoose()
    readFile(path.join(__dirname, 'channels', JSONFile),{encoding:'utf-8'}, (error,text) =>{
        const messages = JSON.parse(text);
        res.render('home',{messages});
    })
})

app.get('/channel/:channelName', (req, res) => {

    const {
        channelName
    } = req.params;

    const channelFileName = path.join(CHANNEL_DIR,`${channelName}.json`);

    if(!existsSync(channelFileName)){
        res.status(404).end();
        return;
    }

    readFile(channelFileName,{encoding:'utf-8'}, (error,text) =>{
        const messages = JSON.parse(text);
        res.render('home',{channel});
    })

})

app.get('/choose/general', (req, res) => {
    isGeneral = true;
    isChannel1 = false;
    ChannelChoose()

    readFile(path.join(__dirname, 'channels', 'general.json'),{encoding:'utf-8'}, (error,text) =>{
        const messages = JSON.parse(text);
        res.render('home',{messages});
    })
})
app.get('/choose/channel1', (req, res) => {

    isGeneral = false;
    isChannel1 = true;
    ChannelChoose()
    readFile(path.join(__dirname, 'channels', 'channel1.json'),{encoding:'utf-8'}, (error,text) =>{
        const messages = JSON.parse(text);
        res.render('home',{messages});
    })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

function ChannelChoose(){
    if(isGeneral){
        JSONFile = 'general.json';
    }
    else if(isChannel1){
        JSONFile = 'channel1.json'
    }
    else{
        JSONFile = 'default.json'
    }
}