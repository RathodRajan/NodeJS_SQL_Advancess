const fs = require('fs');

const { filePath } = JSON.parse(process.argv[2]);

async function readFile() {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });

        readStream.on('data', async (chunk) => {
            return await process.send({ chunk });
        });

        readStream.on('end', () => {
            process.send({ chunk: null });
            resolve();
        });

        readStream.on('error', (err) => {
            process.send({ event: 'error', error: err.message });
            reject(err);
        });
    });
}

async function main() {
    try {
        await readFile();
    } catch (error) {
        console.error('Error:', error);
        process.send({ event: 'error', error: error.message });
    }
}

main();
