import proxyChain from 'proxy-chain'
import logging from 'improved-logging'
import axios from 'axios'
import env from './env.js'


export async function getAnonProxy(proxies: string[], i: number): Promise<string | undefined> {
    if (i === 0) return undefined
    const proxy = proxies[i - 1]
    const anonProxy = await proxyChain.anonymizeProxy(proxy)
    logging.info(`Anonymizing proxy ${proxy} to ${anonProxy}`)
    return anonProxy
}

export default async function getProxies(max = 999_999): Promise<string[] | undefined> {
    try {
        // Skip if proxies are not needed
        if (max === -1)
            return []

        let proxies: Proxy[] = []
        proxies.push(...(await getProxiesFromProxySeller() || []))
        proxies.push(...(await getProxiesFromWebshare() || []))

        logging.info(`Testing ${proxies.length} proxies`)
        proxies = await asyncFilter<Proxy>(proxies, async (proxy: any) => await isProxyWorking(proxy))

        logging.success(`Accumulated ${proxies.length} proxies`)

        // Convert proxies to strings (to be used by puppeteer)
        let proxyStrings = proxies.map((proxy) => proxyToString(proxy))

        // cut to max
        proxyStrings = proxyStrings.slice(0, max)

        logging.success(`Using ${proxyStrings.length} proxies`)

        return proxyStrings
    } catch (error) {
        logging.error(`Error getting proxies: ${error}`)
        return undefined
    }
}

async function getProxiesFromProxySeller(): Promise<Proxy[] | undefined> {
    try {
        const PROXY_API_KEY = env.PROXY_API_KEY
        const url = `https://proxy-seller.io/personal/api/v1/${PROXY_API_KEY}/proxy/list/`

        const response = await axios(url)
            .catch((error) => {
                logging.error(`Error getting proxies: ${error}`)
                throw error
            })
        const ipv4ProxiesArray = response.data.data.ipv4
        const proxies = ipv4ProxiesArray.map((proxy: ProxySellerProxy) => {
            return {
                host: proxy.ip,
                port: proxy.port_http,
                username: proxy.login,
                password: proxy.password
            }
        })
        logging.success(`Got ${proxies.length} proxies from proxy-seller.io`)
        return proxies
    } catch (error) {
        logging.error(`Error getting proxies from proxy-seller: ${error}`)
        return undefined
    }
}

async function getProxiesFromWebshare(): Promise<Proxy[] | undefined> {
    try {
        const apiKey = env.PROXY_WEBSHARE_API_KEY

        //"Authorization": "Token "+apiKey
        const url = new URL('https://proxy.webshare.io/api/v2/proxy/list/')
        url.searchParams.append('mode', 'direct')
        url.searchParams.append('page', '1')
        url.searchParams.append('page_size', '50')

        const req: Proxy[] = await axios.get(url.href, { headers: { Authorization: "Token " + apiKey } })
            .then((response) => {
                logging.success(`Got ${response.data.count} proxies from webshare.io`)
                return response.data.results.map((proxy: WebshareProxy) => {
                    return {
                        host: proxy.proxy_address,
                        port: proxy.port,
                        username: proxy.username,
                        password: proxy.password
                    }
                })
            })
            .catch((error) => {
                logging.error(`Error getting proxies from webshare.io: ${error}`)
                throw error
            })
        return req
    } catch (error) {
        logging.error(`Error getting proxies from webshare.io: ${error}`)
        return undefined
    }
}

async function isProxyWorking(proxy: Proxy): Promise<boolean> {
    const { host, port, username, password } = proxy
    try {
        const request = await axios.get('https://api.ipify.org?format=json',
            {
                proxy: {
                    protocol: 'http',
                    host,
                    port,
                    auth: {
                        username,
                        password
                    }
                }
            })
        return request.data.ip === host
    } catch (error) {
        return false
    }
}

type Proxy = {
    host: string,
    port: number,
    username: string,
    password: string
}

type ProxySellerProxy = {
    id: number,
    order_id: number,
    ip: string,
    port_http: number,
    port_socks: number,
    login: string,
    password: string,
    auth_ip: string,
    country: string,
    data_start: string,
    data_end: string,
    comment: string,
    status: string,
    rotation: string,
    link_reboot: string,
    can_prolong: boolean,
}

type WebshareProxy = {
    id: string,
    proxy_address: string,
    port: number,
    username: string,
    password: string,
    valid: boolean,
    last_verification: string,
    country_code: string,
    city_name: string,
    created_at: string,
}


function proxyToString(proxy: Proxy) {
    return `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
}

const asyncFilter = async <T>(arr: T[], predicate: (value: T) => Promise<boolean>): Promise<T[]> => {
    const results = await Promise.all(arr.map(predicate));
    return arr.filter((_v, index) => results[index]);
};

