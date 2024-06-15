







const { parentPort, workerData } = require('worker_threads');
const { fork } = require('child_process');
const path = require('path');

const { filePath } = workerData;

async function readFileWithChildProcess(filePath) {
    return new Promise((resolve, reject) => {
        const childPath = path.join(__dirname, '../ChildProcess/ChildProcessFileReader.js');
        const child = fork(childPath, [JSON.stringify({ filePath })]);

        child.on('message', async (msg) => {
            if (msg.chunk !== null) {
                return await parentPort.postMessage({ chunk: msg.chunk });
            } else {
                console.log("file reader worker read");
                parentPort.postMessage({ chunk: null });
                resolve();
            }
        });

        child.on('error', (err) => {
            console.error('Error in child process:', err);
            parentPort.postMessage({ event: 'error', error: err });
            reject(err);
        });

        child.on('exit', (code) => {
            if (code !== 0) {
                const error = new Error(`Child process exited with code ${code}`);
                parentPort.postMessage({ event: 'error', error: error.message });
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

async function main() {
    try {
        await readFileWithChildProcess(filePath);
    } catch (error) {
        console.error('Error:', error);
        parentPort.postMessage({ event: 'error', error: error.message });
    }
}

main();
























// const { parentPort, workerData } = require('worker_threads');
// const fs = require('fs');


// const { filePath } = workerData;

// try {
//     const readStream = fs.createReadStream(filePath);

//     readStream.on('open', async() => {
//       await readStream.on('data', async (chunk) => {
//           return await parentPort.postMessage({ chunk }); 
//         });
//         readStream.on('end', () => {
//             parentPort.postMessage({ chunk: null });
//         });
//     });

//     readStream.on('error', (err) => {
//         console.error('Error reading file:', err);
//         parentPort.postMessage({ event: 'error', error: err });
//     });
// } catch (error) {
//     console.error('Error:', error);
//     parentPort.postMessage({ event: 'error', error: error });
// }
