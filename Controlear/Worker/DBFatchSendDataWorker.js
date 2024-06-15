const { parentPort, workerData } = require('worker_threads');
const { fork } = require('child_process');
const path = require('path');

const { query, queryParams , page} = workerData; // No need for filePath

async function readFileWithChildProcess() {
  return new Promise((resolve, reject) => {
    const childPath = path.join(__dirname, '../ChildProcess/ChildProcessDBDataReade.js');
    const child = fork(childPath, [JSON.stringify({ query, queryParams })]);

    child.on('message', async (msg) => {
      if (msg.chunk !== null) {
        return await parentPort.postMessage({ chunk: msg.chunk });
      } else { 
        console.log("file reader worker read"+ page);
        return await resolve(parentPort.postMessage({ chunk: null }));
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
    await readFileWithChildProcess();
  } catch (error) {
    console.error('Error:', error);
    parentPort.postMessage({ event: 'error', error: error.message });
  } finally {
    parentPort.close(); // Close the parent port to prevent further communication
  }
}

main();


 








































// const { parentPort, workerData } = require('worker_threads');
// const path = require('path');
// const db = require('../../DB_Connection/DB_Connection');

// const { Readable } = require('stream');

// parentPort.on('message', async (message) => {
//   if (message.type === 'stream') {
//     const { query, queryParams } = workerData;

//     const readable = new Readable({
//       objectMode: true,
//       read() { } // No need to implement read as data is pushed manually
//     });

//     readable.push('[');
//     let isFirstRow = true;
//     await db.query(query, queryParams).stream()
//       .on('error', (err) => {
//         console.error('Error executing the query:', err);
//         parentPort.postMessage({ error: 'Internal server error' });
//         readable.destroy(err);
//       })
//       .on('data', async (row) => {
//         if (!isFirstRow) {
//           readable.push(',\n');
//         }
//         readable.push('{');
//         const columns = Object.keys(row);
//         columns.forEach(async (col, index) => {
//           if (index > 0) {
//             readable.push(',');
//           }
//         await readable.push(`"${col}":${JSON.stringify(row[col])}`);
//         });
//         readable.push('}');
//         isFirstRow = false;
//       })
//       .on('end', () => {
//         readable.push(']');
//         readable.push(null);
//         console.log('All rows have been streamed.');
//       });

//     // Forward data chunks and end signal to the main thread
//     readable.on('data', async (chunk) => {
//       await parentPort.postMessage({ chunk: chunk.toString() });
//     });

//     readable.on('end', () => {
//       parentPort.postMessage({ chunk: null });
//     });
//   }
// });














// const { parentPort, workerData } = require('worker_threads');
// const db = require('../DB_Connection/DB_Connection'); // Assuming your DB connection module
// const { Readable } = require('stream');

// parentPort.on('message', async (message) => {
//   if (message.type === 'stream') {
//     const { query, queryParams } = workerData;

//     const readable = new Readable({
//       objectMode: true,
//       read() {} // No need to implement read as data is pushed manually
//     });

//     readable.push('[');
//     let isFirstRow = true;

//     db.query(query, queryParams).stream()
//       .on('error', (err) => {
//         console.error('Error executing the query:', err);
//         parentPort.postMessage({ error: 'Internal server error' });
//         readable.destroy(err);
//       })
//       .on('data', (row) => {
//         if (!isFirstRow) {
//           readable.push(',\n');
//         }
//         readable.push(JSON.stringify(row));
//         isFirstRow = false;
//       })
//       .on('end', () => {
//         readable.push(']');
//         readable.push(null);
//         console.log('All rows have been streamed.');
//       });

//     // Forward data chunks and end signal to the main thread
//     readable.on('data', (chunk) => {
//       parentPort.postMessage({ chunk: chunk.toString() });
//     });

//     readable.on('end', () => {
//       parentPort.postMessage({ chunk: null }); // Signal the end of the stream
//     });
//   }
// });
