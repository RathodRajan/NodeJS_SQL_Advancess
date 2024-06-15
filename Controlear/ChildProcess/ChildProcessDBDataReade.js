
const { Readable } = require('stream');
const db = require('../../DB_Connection/DB_Connection');

async function readFile() {
    try {
        const { query, queryParams } = JSON.parse(process.argv[2]);

        const readable = new Readable({
            objectMode: true,
            read() { } // No need to implement read as data is pushed manually
        });

        readable.push('[');
        let isFirstRow = true;

    await  db.query(query, queryParams).stream().on('error', (err) => {
            console.error('Error executing the query:', err);
            process.send({ error: 'Internal server error' });
            readable.destroy(err);
        }).on('data', async (row) => {
            if (!isFirstRow) {
                readable.push(',\n');
            }
            await  readable.push(JSON.stringify(row));
            isFirstRow = false;
        }).on('end', () => {
            readable.push(']');
            readable.push(null);
            console.log('All rows have been streamed.');
        });

        // Forward data chunks and end signal to the main thread
        readable.on('data', async (chunk) => {
           return await  process.send({ chunk: chunk.toString() });
        });

        readable.on('end', () => {
            process.send({ chunk: null });
        });
    } catch (error) {
        console.error('Error:', error);
        process.send({ event: 'error', error: error.message });
    }
}

readFile();
