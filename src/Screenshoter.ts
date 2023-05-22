import fs from "fs";
import logging from "improved-logging";
import path from "path";
import puppeteer from "puppeteer-core";


const directory = "./screenshots";
const tempDirectory = "./temp";

export class Screenshoter {

    static async makeScreenshot(streamPage: puppeteer.Page, user: string) {
        // empty and ensure folder
        if (!fs.existsSync(directory))
            fs.mkdirSync(directory);

        // prepare to screenshot: zoom out the chrome page
        await streamPage.evaluate(() => {
            // @ts-ignore
            document.body.style.zoom = "65%";
        });

        // place screenshot in temp folder first, then move it to the screenshots folder
        const screenPath = path.join(directory, `${user}.png`)
        const tempScreenPath = path.join(tempDirectory, `${user}.png`)
        try {
            await streamPage.screenshot({ path: tempScreenPath });
            fs.renameSync(tempScreenPath, screenPath);
        } catch (e) {
            logging.error(`Error while taking screenshot: ${e}`);
        }
    }

    static clearScreenshots() {
        if (fs.existsSync(directory))
            fs.rmdirSync(directory, { recursive: true })
        if (fs.existsSync(tempDirectory))
            fs.rmdirSync(tempDirectory, { recursive: true })
        fs.mkdirSync(directory)
        fs.mkdirSync(tempDirectory)
    }

    static getScreenshots() {
        if (!fs.existsSync(directory))
            fs.mkdirSync(directory)
        return fs.readdirSync(directory)
    }

    static getScreenshotPath(name: string): string {
        return path.join(directory, name)
    }

    static getDirectory(): string {
        return directory
    }
}
