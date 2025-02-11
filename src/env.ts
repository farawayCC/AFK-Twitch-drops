import dotenv from 'dotenv';

// parsing the env file

dotenv.config({ path: '.env' });

// Interface to load env variables
// Note these variables can possibly be undefined
// as someone could skip these varibales or not setup a .env file at all
interface ENV {
    PORT: number | undefined
    MAX_BOTS: number | undefined
    PROXY_API_KEY: string | undefined
    PROXY_WEBSHARE_API_KEY: string | undefined
    STREAMER: string | undefined
    USE_BROWSERS: string | undefined
    ONLINE_INTERVAL_MS: number | undefined
    SCREENSHOT_INTERVAL_MS: number | undefined
    CHROME_PATH: string | undefined
}

interface Config {
    PORT: number
    MAX_BOTS: number
    PROXY_API_KEY: string
    PROXY_WEBSHARE_API_KEY: string
    STREAMER: string
    USE_BROWSERS: boolean
    ONLINE_INTERVAL_MS: number | undefined
    SCREENSHOT_INTERVAL_MS: number | undefined
    CHROME_PATH: string | undefined
}

// Loading process.env as ENV interface
const getConfig = (): ENV => {
    return {
        PORT: parseInt(process.env.PORT || '9876') || 9876,
        MAX_BOTS: parseInt(process.env.MAX_BOTS || '999999') || 999999,
        PROXY_API_KEY: process.env.PROXY_API_KEY,
        PROXY_WEBSHARE_API_KEY: process.env.PROXY_WEBSHARE_API_KEY,
        STREAMER: process.env.STREAMER,
        USE_BROWSERS: process.env.USE_BROWSERS,
        ONLINE_INTERVAL_MS: parseInt(process.env.ONLINE_INTERVAL_MS || '120000'),
        SCREENSHOT_INTERVAL_MS: parseInt(process.env.SCREENSHOT_INTERVAL_MS || '20000'),
        CHROME_PATH: process.env.CHROME_PATH,
    };
}

// Throwing an Error if any field was undefined we don't 
// want our app to run if it can't connect to DB and ensure 
// that these fields are accessible. If all is good return
// it as Config which just removes the undefined from our type 
// definition.

const getSanitizedConfig = (config: ENV): Config => {
    for (const [key, value] of Object.entries(config)) {
        if (value === undefined) {
            throw new Error(`Missing key ${key} in .env file`);
        }
    }

    // Converting string to arrays and booleans
    const newConfig = config as any;
    newConfig.USE_BROWSERS = strToBool(config.USE_BROWSERS);

    return newConfig as Config;
};

const strToBool = (str: string | undefined): boolean => str === 'true'.toLowerCase();


const config = getConfig();

const env = getSanitizedConfig(config);

export default env;
