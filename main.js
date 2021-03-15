const express = require('express')
let http = require('http');
const {readFile, writeFile, existsSync, readdir, readdirSync, readFileSync} = require('fs')
const path = require('path')
const exphbs  = require('express-handlebars')
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const CHANNEL_DIR = path.join(__dirname, 'channels')
const USER_DIR = path.join(__dirname, 'user')
const FILE_OPTIONS = {encoding:'utf8'}

const app = express()
let server = http.createServer(app);
const port = 3000

let machtes
//let tempFile

let testName = 'general'

let channels =[]

let channelFileName = path.join(CHANNEL_DIR, `general.json`)
let userFileName = path.join(USER_DIR, `Users.json`)

// To support URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// To parse cookies from the HTTP Request
app.use(cookieParser());

app.engine('handlebars', exphbs())
app.set('view engine', 'handlebars')
app.use('/static', express.static( './public'));
app.use(express.urlencoded())

Array.prototype.insert = function (index, item){ this.splice(index, 0, item)}

const crypto = require('crypto')
const generateAuthToken = () => {
    return crypto.randomBytes(30).toString('hex')
}

const authTokens = {}

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256')
    const hash = sha256.update(password).digest('base64')
    return hash
}

app.use((req, res, next) =>{
    const authToken = req.cookies['AuthToken']
    req.user = authTokens[authToken]

    next()
} )

const users = JSON.parse(readFileSync(userFileName, 'utf-8'))

app.get('/', (request, response) => {
    response.render('home')
})

app.get('/register', (req, res) => {
    res.render('registration')
})

app.post('/register', (req, res) => {
    const {name, password,confirmPassword} = req.body

    if(password === confirmPassword){

        if(users.find(user => user.name === name)){
            res.render('register',{
                message: 'User already registered.',
                messageClass: 'alert-danger'
            })
            return
        }

        const hashedPassword = getHashedPassword(password)

        users.push({
            name,
            password: hashedPassword,
            role: 'standard'
        })

        writeFile(userFileName, JSON.stringify(users,null,2),{encoding:'utf-8'}, err => {
            res.render('login',{
                message: 'Registration complete. Please login to continue',
                messageClass: 'alert-success'
        })
        })
    }else {
        res.render('registration',{
            message: 'Password does not match.',
            messageClass: 'alert-danger'
        })
    }
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', (req, res) => {
    const {name,password} = req.body
    const hashedPassword = getHashedPassword(password)

    const user = users.find(u=>{
        return u.name === name && hashedPassword === u.password
    })

    if(user){
        const authToken = generateAuthToken()

        authTokens[authToken] = user
        res.cookie('AuthToken', authToken)

        res.redirect(`channel/${testName}`)
    }else{
        res.render('login',{
            message: 'Invalid username or password',
            messageClass: 'alert-danger'
        })
    }

})

app.get('/channel/:channelName', (request, response) => {

    if(request.user){
    const {channelName} = request.params

    testName = channelName

    channelFileName = path.join(CHANNEL_DIR, `${channelName}.json`)

    if(!existsSync(channelFileName)){
        response.status(404).end()
        return
    }


    let files = readdirSync(CHANNEL_DIR,{encoding: 'utf-8'})

        for (let file of files){

            const fileName = path.join(CHANNEL_DIR, file)
            let tempFile = JSON.parse(readFileSync(fileName, 'utf-8'))
            /*readFile(fileName, {encoding: 'utf-8'}, (err, data) => {
                tempFile = JSON.parse(data)*/

                if(channels.length < 1){
                    channels.push(tempFile)
                }else if(!channels.some(el =>{
                    if(el.name === tempFile.name){
                        return true
                    }
                })){
                    channels.push(tempFile)
                }
        }
        channels.sort(function (a,b) {
            return a.id - b.id
        })

        readFile(
            channelFileName,
            FILE_OPTIONS,
            (error, text) => {
                if(error){
                    response.status(500).end()
                    return
                }
                const channel = JSON.parse(text)
                console.log(channel.messages[0].mesid)
                response.render('channel', {channel, channels})
            })
    }else{
        response.render('login',{
            message: 'Please login to continue.',
            messageClass: 'alert-danger'
        })
    }
})

app.post('/channel/:channelName', (request, response) => {

    const {channelName} = request.params

    testName = channelName

    const {mesid, author, text, xpos, ypos} = request.body
    const message = {
        mesid,
        author,
        text,
        xpos,
        ypos
    }

    message.author = request.user.name

    const {writer} = request.user.name
    const testwriter = {
        name: request.user.name
    }
    const userrole = request.user.role


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
            message.mesid = channel.messages.length + 1
            console.log(message.mesid)
            channel.messages.unshift(message)

            machtes = channel.empty
            //console.log(channel.users.role)

            if(channel.users.some(el=>{
                if(el.name === message.author)
                    return true
            })){
                machtes = false
            }else
                machtes = true

            if(machtes){
                machtes = false;
                channel.users.push(testwriter)
            }

            writeFile(channelFileName, JSON.stringify(channel, null, 2), FILE_OPTIONS, (error)=> {
                if(error){
                    response.status(500).end()
                } else {
                    response.redirect(`/channel/${testName}`)
                }
            })
        })
})

app.post('/channelrm/:channelName', (request, response) => {

    const {channelName} = request.params

    testName = channelName

    const {author, text, xpos, ypos} = request.body
    const message = {
        author,
        text,
        xpos,
        ypos
    }

    message.author = request.user.name

    const {writer} = request.user.name
    const testwriter = {
        name: request.user.name
    }
    const userrole = request.user.role


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
            channel.messages.slice(0,-1)

            writeFile(channelFileName, JSON.stringify(channel, null, 2), FILE_OPTIONS, (error)=> {
                if(error){
                    response.status(500).end()
                } else {
                    response.redirect(`/channel/${testName}`)
                }
            })
        })
})

app.listen(port,() => {
    console.log(`Example app listening at http://localhost:${port}`)
})

app.post('/messagedrob/:channelName', (request, response) => {
    const {channelName} = request.params

    testName = channelName

    const {mesid, xpos, ypos} = request.body
    const poschange = {
        mesid,
        xpos,
        ypos
    }

    let messageId = parseInt(poschange.mesid)
    let messagexpos = parseInt(poschange.xpos)
    let messageypos = parseInt(poschange.ypos)


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

            let indexofmessage

            channel.messages.some(e => {
                if(e.mesid ===  messageId){
                    indexofmessage= channel.messages.indexOf(e)
                    return true
                }
            })

            channel.messages[indexofmessage].mesid = messageId
            channel.messages[indexofmessage].ypos = messageypos
            channel.messages[indexofmessage].xpos = messagexpos


            writeFile(channelFileName, JSON.stringify(channel, null, 2), FILE_OPTIONS, (error)=> {
                if(error){
                    response.status(500).end()
                } else {
                    response.redirect(`/channel/${testName}`)
                }
            })
        })
})

app.post('/testichannel', (req, res) => {
    const { ichannel } = req.body

    const addnewchannel = {
        ichannel
    }

    readFile(path.join(__dirname, 'basicchannel.json'),FILE_OPTIONS, (err, data) => {
        if(err){
            res.status(500).end()
            return
        }
        const content = JSON.parse(data)
        content.name = ichannel
        content.id = channels.length

        writeFile(path.join(CHANNEL_DIR, `${addnewchannel.ichannel}.json`), JSON.stringify(content, null, 2), FILE_OPTIONS, (error)=> {
            if(error){
                res.status(500).end()
            } else {
                res.redirect(`/channel/${addnewchannel.ichannel}`)
            }
        })
    })
})

app.get('/channeltest/:channelName', (request, response) => {

    if(request.user){
        const {channelName} = request.params

        testName = channelName

        channelFileName = path.join(CHANNEL_DIR, `${channelName}.json`)

        if(!existsSync(channelFileName)){
            response.status(404).end()
            return
        }


        let files = readdirSync(CHANNEL_DIR,{encoding: 'utf-8'})

        for (let file of files){

            const fileName = path.join(CHANNEL_DIR, file)
            let tempFile = JSON.parse(readFileSync(fileName, 'utf-8'))
            /*readFile(fileName, {encoding: 'utf-8'}, (err, data) => {
                tempFile = JSON.parse(data)*/

            if(channels.length < 1){
                channels.push(tempFile)
            }else if(!channels.some(el =>{
                if(el.name === tempFile.name){
                    return true
                }
            })){
                channels.push(tempFile)
            }
        }
        channels.sort(function (a,b) {
            return a.id - b.id
        })

        readFile(
            channelFileName,
            FILE_OPTIONS,
            (error, text) => {
                if(error){
                    response.status(500).end()
                    return
                }
                const channel = JSON.parse(text)
                response.render('channel', {channel , channels})
            })
    }else{
        response.render('login',{
            message: 'Please login to continue.',
            messageClass: 'alert-danger'
        })
    }
})

app.post('/channeltest/:channelName', (request, response) => {

    const {channelName} = request.params

    testName = channelName

    const {mesid, author, text, xpos, ypos} = request.body
    const message = {
        mesid,
        author,
        text,
        xpos,
        ypos
    }

    message.author = request.user.name

    const {writer} = request.user.name
    const testwriter = {
        name: request.user.name
    }
    const userrole = request.user.role


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
            message.mesid = channel.messages.length
            channel.messages.unshift(message)

            machtes = channel.empty
            //console.log(channel.users.role)

            if(channel.users.some(el=>{
                if(el.name === message.author)
                    return true
            })){
                machtes = false
            }else
                machtes = true

            if(machtes){
                machtes = false;
                channel.users.push(testwriter)
            }

            writeFile(channelFileName, JSON.stringify(channel, null, 2), FILE_OPTIONS, (error)=> {
                if(error){
                    response.status(500).end()
                } else {
                    response.redirect(`/channel/${testName}`)
                }
            })
        })
})