import express, { Request, Response } from 'express'
import logging from 'improved-logging'
import fs from 'fs'
import path from 'path'
import getProxies, { getAnonProxy } from './Proxies.js'
import Bot from './Bot.js'
import { exec } from 'child_process'
import env from './env.js'


const proxiesFromServer: string[] | undefined = await getProxies()
if (!proxiesFromServer) {
    logging.error('No proxies found, exiting')
    process.exit(1)
}
const proxies = proxiesFromServer || []


let bots: Bot[] = []

const app = express()

app.use(express.json())

// log url and method
// app.use((req, res, next) => {
//     if (req.url !== '/bots/running')
//         logging.info(`${req.method} ${req.url}`)
//     next()
// })


app.get('/', (req: Request, res: Response) => {
    const filepath = path.join('resources', 'index.html')
    const file = fs.readFileSync(filepath, 'utf8')
    res.send(file)
})

app.get('/bots/running', (req: Request, res: Response) => {
    const runningBots = getRunningBots().length
    res.send(`Currently running ${runningBots} bots`)
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

function getRunningBots() {
    return bots.filter(bot => bot.status === 'running')
}


app.post('/bots/start', async (req: Request, res: Response) => {
    await respawnBots()
    res.send('Started all bots')
})

app.post('/bots/stop', async (req, res) => {
    await stopBots()
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


app.listen(env.PORT, () => {
    logging.info('Server running on port ' + env.PORT)
    respawnBots();
})

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
    if (fs.existsSync('screenshots'))
        fs.rmdirSync('screenshots', { recursive: true })
    fs.mkdirSync('screenshots')
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

