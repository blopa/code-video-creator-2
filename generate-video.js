const path = require("path");
const { readFileSync } = require("fs");
const puppeteer = require('puppeteer');
const minimist = require("minimist");
const { exec, execSync } = require('child_process');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const params = minimist(process.argv, {
    // boolean: ['showSomething'],
});

const scale = 2;
const WIDTH = 960 * scale;
const HEIGHT = 540 * scale;

const initialFiles = [...params['_']].slice(2);
const commandsFilepath = params.commands;

const getRandomBetween = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const generatePreviews = () => {
    execSync('npx kill-port 3000');
    console.log('Starting Webpack');
    let process;
    if (initialFiles.length) {
        const stringfied = JSON.stringify(initialFiles);
        process = exec(`REACT_APP_INITIAL_FILES='${stringfied}' npm run start-puppeteer-server`);
    } else {
        process = exec('npm run start-puppeteer-server');
    }
    // console.log('Process ID:', process.pid);

    process.stdout.on('data', (data) => {
        // console.log(data.toString());
        if (data.toString().includes('webpack 5.68.0 compiled')) {
            console.log('Webpack done executing');
            runPuppeteer(process);
        }
    });
};

const getLinePosition = async(page, line) => {
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

    const commands = readFileSync(path.resolve(__dirname, 'src', 'initial_files', commandsFilepath), { encoding: 'utf8' });
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

    for (const line of commands.split('\n')) {
        if (line.trimStart().startsWith('//#')) {
            const [, command] = line.split('//#');
            if (command.includes('open_file')) {
                const [, fileName] = command.split(';');
                const fileTab = await page.$(`[data-puppeteer-selector="${fileName}"]`)
                await fileTab.click();
                await page.waitForTimeout(1000);
            } else if (command.includes('go_to_line')) {
                const [, line] = command.split(';');
                const data = await getLinePosition(page, line);
                await page.mouse.click(data.x, data.y);
                await page.waitForTimeout(500);
                await page.keyboard.press('Enter');
                await page.keyboard.press('ArrowUp');
                await page.waitForTimeout(500);
            } else if (command.includes('refresh')) {
                // TODO make this not scroll to element
                // const refreshButton = await page.$(`[data-puppeteer-selector="refresh"]`)
                // await refreshButton.click();
                await page.evaluate(() => window.reCalculateFunctions());
                await page.waitForTimeout(1000);
            }
        } else if (line) {
            await page.waitForTimeout(500);
            for (const letter of [...line]) {
                await page.keyboard.press(letter);
                await page.waitForTimeout(getRandomBetween(100, 220));
            }
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
        }
    }

    await page.waitForTimeout(3000);

    await recorder.stop();
    await browser.close();
    p.kill();
    console.log('done!');
    // execSync('fuser -k 3000/tcp');
    execSync('npx kill-port 3000');
    process.exit(1);
};

generatePreviews();
