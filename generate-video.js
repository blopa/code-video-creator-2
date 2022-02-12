const path = require('path');
const puppeteer = require('puppeteer');
const { exec, execSync } = require('child_process');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

const WIDTH = 960;
const HEIGHT = 540;

console.log(process.argv);
const args = [...process.argv].slice(2);

const generatePreviews = () => {
    execSync('npx kill-port 3000');
    console.log('Starting Webpack');
    let process;
    if (args.length) {
        const stringfied = JSON.stringify(args);
        process = exec(`REACT_APP_INITIAL_FILES='${stringfied}' npm run start-puppeteer-server`);
    } else {
        process = exec('npm run start-puppeteer-server');
    }
    // console.log('Process ID:', process.pid);

    process.stdout.on('data', (data) => {
        console.log(data.toString());
        if (data.toString().includes('webpack 5.68.0 compiled')) {
            console.log('Webpack done executing');
            runPuppeteer(process);
        }
    });
};

const runPuppeteer = async (p) => {
    console.log('opening headless browser');
    const browser = await puppeteer.launch({
        headless: true,
        args: [`--window-size=${WIDTH},${HEIGHT}`],
        defaultViewport: {
            width: WIDTH,
            height: HEIGHT,
        },
    });

    const page = await browser.newPage();

    const config = {
        followNewTab: false,
        fps: 25,
        ffmpeg_Path: null,
        videoFrame: {
            width: WIDTH,
            height: HEIGHT,
        },
        aspectRatio: '16:9',
    };

    const recorder = new PuppeteerScreenRecorder(page, config);

    console.log('going to localhost');
    await page.goto('http://localhost:3000/');
    await page.waitForFunction(() => window.isReady);
    await page.reload();
    await page.waitForFunction(() => window.isReady);

    await recorder.start('./output.mp4');
    await page.waitForTimeout(1000);

    const getLinePosition = async(line) => {
        return await page.evaluate(async (line) => {
            return await new Promise(resolve => {
                const lines = document.querySelectorAll('.ace_line');
                const bounds = lines[line - 1].getBoundingClientRect();
                resolve({
                    x: bounds.x,
                    y: bounds.y,
                });
            })
        }, line);
    };

    const data = await getLinePosition(11);
    await page.mouse.click(data.x, data.y);
    await page.waitForTimeout(3000);

    await browser.close();
    p.kill();
    console.log('done!');
    // execSync('fuser -k 3000/tcp');
    execSync('npx kill-port 3000');
    process.exit(1);
};

generatePreviews();
