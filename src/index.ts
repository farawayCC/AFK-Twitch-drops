import express, { Request, Response } from 'express'
import logging from 'improved-logging'
import fs from 'fs'
import path from 'path'
import getProxies, { getAnonProxy } from './Proxies.js'
import Bot, { TBotStatus } from './Bot.js'
import { exec } from 'child_process'
import env from './env.js'
import { Screenshoter } from './Screenshoter.js'


const proxiesFromServer: string[] | undefined = await getProxies(env.MAX_BOTS)
if (!proxiesFromServer) {
    logging.error('No proxies found, exiting')
    process.exit(1)
}
const proxies = proxiesFromServer || []

if (proxies.length === 0)
    logging.important('No proxies found. To change this, set MAX_BOTS to -1 in .env, or check proxy provider')



let bots: Bot[] = []

const app = express()

app.use(express.json())

// log url and method
// app.use((req, res, next) => {
//     if (req.url !== '/bots/running')
//         logging.info(`${req.method} ${req.url}`)
//     next()
// })


// -- Routes -- //
logging.info('Hosting html file on http://localhost:' + env.PORT)
app.get('/', (req: Request, res: Response) => {
    const filepath = path.join('resources', 'index.html')
    const file = fs.readFileSync(filepath, 'utf8')
    res.send(file)
})

app.use(express.static('resources'))

app.get('/bots/running', (req: Request, res: Response) => {
    const runningBots = getRunningBots().length
    res.send(runningBots.toString())
})

app.get('/bots/status', (req: Request, res: Response) => {
    const statuses = bots.map((bot) => bot.status)
    const statusesCountObject = statuses.reduce((acc: any, curr) => {
        acc[curr] = (acc[curr] || 0) + 1
        return acc
    }, {})

    res.send(statusesCountObject)
})


app.get('/system/restart', async (req: Request, res: Response) => {
    try {
        await restartSystem();
    } catch (error) {
        logging.error(error)
        return res.send('Error restarting system, check logs')
    }
    res.send('Restarting system...')
})

app.post('/bots/start', async (req: Request, res: Response) => {
    await respawnBots()
    res.send('Started all bots')
})

app.post('/bots/stop', async (req, res) => {
    await stopBots()
    Screenshoter.clearScreenshots()
    res.send('Stopped all bots')
})

app.get('/bots/setUsername', async (req: Request, res: Response) => {
    const username = req.query.username
    if (!username) return res.send('No username provided')
    await stopBots()

    const envPath = '.env'
    const envFile = fs.readFileSync(envPath, 'utf8')
    const newEnvFile = envFile.replace(/STREAMER=.*/g, `STREAMER=${username}`)
    fs.writeFileSync(envPath, newEnvFile)

    res.send('Set username to ' + username)
})

app.get('/bots/username', (req: Request, res: Response) => {
    const envPath = '.env'
    const envFile = fs.readFileSync(envPath, 'utf8')
    const username = envFile.match(/STREAMER=(.*)/)?.[1]
    res.send(username)
})


app.post('/bots/chat/:message', (req: Request, res: Response) => {
    // const message = req.params.message
    // const randomBot = getRunningBots()[Math.floor(Math.random() * bots.length)]
    // if (!message) return res.send('No message provided')
    // if (!randomBot) return res.send('No bots running')
    // randomBot.chat(message)
    // logging.info(`Chat function executed on bots with message: ${message}`)
    // res.send('Chat function executed on bots with message: ' + message)
    res.send('Not implemented yet')
})

app.get('/images', (req: Request, res: Response) => {
    const images = Screenshoter.getScreenshots()
    type ImageData = { name: string, url: string }
    let result: ImageData[] = []
    for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const url = `/image/${image}`
        result.push({ name: image, url })
    }
    res.send(result)
})

app.use('/image', express.static(Screenshoter.getDirectory()))



// -- Start Server -- //

app.listen(env.PORT, () => {
    logging.success('Server running on port ' + env.PORT)
})

// -- Functions -- //

async function stopBots() {
    logging.important('Stopping all bots...')
    for (let i = 0; i < bots.length; i++) {
        const bot = bots[i]
        if (bot.isRunning())
            await bot.stop()
    }
    bots = []
    logging.success('All bots stopped!')
}

const totalBotsNumber = proxies.length + 1
async function respawnBots() {
    Screenshoter.clearScreenshots()
    logging.warn('Remov1ed all old screenshots')

    logging.important(`Spawning ${totalBotsNumber} bots...`)
    for (let i = 0; i < totalBotsNumber; i++) {
        const proxy = await getAnonProxy(proxies, i)
        const newBot = new Bot(proxy)
        bots.push(newBot)
        await newBot.start()
    }
    logging.success('All bots started!')
}


async function restartSystem() {
    return new Promise((resolve, reject) => {
        // send the system command "pm2 restart all"
        // this will restart the server and all bots
        exec('pm2 restart all', (err: any, stdout: any, stderr: any) => {
            if (err) {
                logging.error(err)
                return reject(err)
            }
            logging.success(stdout)
            resolve(stdout)
        })
    })
}

function getRunningBots() {
    return bots.filter(bot => bot.status === 'running')
}
