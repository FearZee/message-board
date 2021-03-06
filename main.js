const express = require('express')
const {readFile, writeFile, existsSync, readdir} = require('fs')
const path = require('path')
const exphbs  = require('express-handlebars')
const CHANNEL_DIR = path.join(__dirname, 'channels')
const USER_DIR = path.join(__dirname, 'users')
const FILE_OPTIONS = {encoding:'utf8'}

const app = express()
const port = 8080

let machtes
let tempFile

let testName = 'general'

let channels =[]

let channelFileName = path.join(CHANNEL_DIR, `general.json`)
let userFileName = path.join(USER_DIR, `general.json`)

app.engine('handlebars', exphbs())
app.set('view engine', 'handlebars')
app.use('/static', express.static( './public'));
app.use(express.urlencoded())

app.get('/', (request, response) => {
    response.redirect(`/channel/${testName}`)
})

app.get('/channel/:channelName', (request, response) => {

    const {channelName} = request.params

    testName = channelName

    channelFileName = path.join(CHANNEL_DIR, `${channelName}.json`)

    if(!existsSync(channelFileName)){
        response.status(404).end()
        return
    }


    readdir(CHANNEL_DIR, (err, files) => {
        if(err){
            response.status(500).end()
            return
        }
        for (let file of files){

            const fileName = path.join(CHANNEL_DIR, file)
            readFile(fileName, {encoding: 'utf-8'}, (err, data) => {
                tempFile = JSON.parse(data)

                if(channels.length < 1){
                    channels.push(tempFile.name)
                }
                if(!channels.includes(tempFile.name)){
                    channels.push(tempFile.name)
                }
            })
        }
        readFile(
            channelFileName,
            FILE_OPTIONS,
            (error, text) => {
                if(error){
                    response.status(500).end()
                    return
                }
                const channel = JSON.parse(text)
                console.log(channels)
                response.render('home', {channel , channels})
            })
    })
})

app.post('/channel/:channelName', (request, response) => {

    const {channelName} = request.params

    testName = channelName

    const {author, text} = request.body
    const message = {
        author,
        text
    }

    const user = {
        author
    }

    if(!existsSync(channelFileName)){
        response.status(404).end()
        return
    }

    readFile(
        channelFileName,
        FILE_OPTIONS,
        (error, text) => {
            if(error){
                response.status(500).end()
                return
            }
            let channel = JSON.parse(text)
            channel.messages.unshift(message)

            machtes = channel.empty

            channel.users.forEach(element => {
                if(element.author === user.author){
                    machtes = false
                    return
                }
                machtes = true;
            })

            if(machtes){
                machtes = false;
                channel.users.push(user)
            }

            writeFile(channelFileName, JSON.stringify(channel, null, 2), FILE_OPTIONS, (error)=> {
                if(error){
                    response.status(500).end()
                } else {
                    response.redirect(`/`)
                }
            })
        })
})

app.listen(port,() => {
    console.log(`Example app listening at http://localhost:${port}`)
})