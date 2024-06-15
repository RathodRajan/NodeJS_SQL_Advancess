
const { Worker } = require('worker_threads');

const db = require('../DB_Connection/DB_Connection');
const { Readable } = require('stream');
const process = require('process');
const fs = require('fs');
const path = require('path');


async function streamFile(filePath, res) {
    const readStream = await fs.createReadStream(filePath);

    await readStream.on('open', async () => {
        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
        await readStream.pipe(res);
    });

    readStream.on('error', (err) => handleError(res, err));
}

const RegistrationUserInFormation = async (req, res) => {
    try {
        const pageFilePath = await path.join(__dirname, `./JsonFile/page${req.params.page}.json`);

        if (fs.existsSync(pageFilePath)) {
            console.log('File read =======================');

            try {
                // Creating a worker thread
                const worker = new Worker(path.join(__dirname, './Worker/FileReadeWorker.js'), {
                    workerData: { filePath: pageFilePath }
                });

                // Handling messages from worker thread
                worker.on('message', async (msg) => {
                    if (msg.chunk !== null) {
                      return await  res.write(msg.chunk);
                    } else {
                        res.end();
                    }
                });

                // Handling errors in worker thread
                worker.on('error', (err) => {
                    console.error('Worker thread error:', err);
                    res.status(500).send('Internal Server Error');
                });

                // Handling worker thread exit
                worker.on('exit', (code) => {
                    if (code !== 0) {
                        console.error(`Worker thread exited with code ${code}`);
                        res.status(500).send('Internal Server Error');
                    }
                });
            } catch (error) {
                console.error('Error occurred while creating worker thread:', error);
                console.log('file read catch =======================');
                return streamFile(pageFilePath, res);
            }

        } 
        else 
        {

            let page = parseInt(req.params.page) || 1;
            let pageSize = 25;
            let offset = (page - 1) * pageSize;

            const query = `SELECT * FROM \`reactcourd\` LIMIT ?, ?`;
            let queryParams = [offset, pageSize];

            let workerPath = path.resolve(__dirname, './Worker/DBFatchSendDataWorker.js');
            let worker = new Worker(workerPath, { workerData: { query, queryParams, page, pageSize } });

            let responseSent = false; // Flag to track if response is sent

            worker.on('message', async (message) => {
                if (message.error) {
                    console.error('Error from worker:', message.error);
                    if (!responseSent) {
                        res.status(500).json({ error: 'Internal server error' });
                        responseSent = true;
                    }
                    worker.terminate(); // Terminate worker on error
                    return;
                }
                if (message.chunk !== null) {
                    if (!responseSent) {
                     return await res.write(message.chunk);
                    }
                } else {
                    if (!responseSent) {
                        res.end();
                        responseSent = true;
                    }
                }
            });

            worker.on('error', (error) => {
                console.error('Worker error:', error);
                if (!responseSent) {
                    res.status(500).json({ error: 'Internal server error' });
                    responseSent = true;
                }
            });

            worker.on('exit', (code) => {
                if (code !== 0 && !responseSent) {
                    console.error(`Worker stopped with exit code ${code}`);
                    res.status(500).json({ error: 'Internal server error' });
                    responseSent = true;
                }
            });

            worker.postMessage({ type: 'stream' });


        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
























// *****  post *********
const NewRegistrationUser = async (req, res) => {
    try {
        const { username, email, image, password, radio } = req.body;

        // Validate input
        if (!username || !email || !image || !password || !radio) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        await new Promise((resolve, reject) => {
            const query = 'INSERT INTO `reactcourd` (`FullName`, `Email`, `Image`, `Password`, `Gender`) VALUES (?, ?, ?, ?, ?)';
            const values = [username, email, image, password, radio];

            db.query(query, values, (error, results) => {
                if (error) {
                    console.error('Post method query error:', error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        console.error('Error in NewRegistrationUser:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


const DeleteUser = async (req, res) => {
    try {
        const userId = req.body.Delete_User_Id;
        console.log(userId);

        await new Promise((resolve, reject) => {
            const query = 'DELETE FROM `reactcourd` WHERE id = ?';
            db.query(query, [req.body.Delete_User_Id], (error, results) => {
                if (error) {
                    console.error('Post method query error:', error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        res.status(201).json({ message: 'Delete successfully' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};

const UpdateInformathin = async (req, res) => {
    const { id, FullName, Email, Gender, Password, Image } = req.body;

    try {
        await new Promise((resolve, reject) => {
            db.query(
                `UPDATE reactcourd SET FullName = ?, Email = ?, Gender = ?, Password = ?, Image = ? WHERE id = ?`,
                [FullName, Email, Gender, Password, Image, id],
                (error, results) => {
                    if (error) {
                        console.error('Update query error:', error);
                        reject(error);
                    } else {
                        resolve(results);
                    }
                }
            );
        });

        res.status(200).json({ message: 'Update successful' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { RegistrationUserInFormation, NewRegistrationUser, DeleteUser, UpdateInformathin }






