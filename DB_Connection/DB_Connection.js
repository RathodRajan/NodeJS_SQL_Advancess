

const mysql = require('mysql');
const util = require('util');

const pool = mysql.createPool({
    connectionLimit: 1000, // Adjust this number based on your server capacity
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'reactregistrationtest',
    waitForConnections: true,
    queueLimit: 0
});

// Promisify the pool.query method
const query = util.promisify(pool.query).bind(pool);

// Function to test the connection and set max_allowed_packet
const initializeDb = async () => {
    try {
        const connection = await util.promisify(pool.getConnection).bind(pool)();
        console.log('Connected successfully');
        await query('SET GLOBAL max_allowed_packet=10000000000000000');
        console.log('max_allowed_packet set successfully');
        connection.release(); // Release the connection back to the pool
    } catch (err) {
        console.error('Error:', err);
    }
};

initializeDb();

module.exports = pool;




















// const mysql = require('mysql');

// (async () => {
//     try {
//         const db = await mysql.createConnection({
//             host: 'localhost',
//             user: 'root',
//             password: '',
//             database: 'reactregistrationtest',
//             waitForConnections: true,
//             // connectionLimit: 10, // Optional connection pool configuration
//             // queueLimit: 0       // Optional connection pool configuration
//         });

//         console.log('Connected successfully');

//         await db.query('SET GLOBAL max_allowed_packet=10000000000000000'); // Set max_allowed_packet
//         console.log('max_allowed_packet set successfully');

//         module.exports = db;
//     } catch (err) {
//         console.log('Database connetion close  DB_conneton file , catch block call');
//         await db.end();
//         console.error('Error:', err);

//     }
// })(); 
 









// const mysql = require('mysql');

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'reactregistrationtest',
//     waitForConnections: true,
//     // connectionLimit: 10,
//     // queueLimit: 0
// });

// // Function to test the connection and set max_allowed_packet
// db.connect((err) => {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log('Connected successfully');
//         db.query('SET GLOBAL max_allowed_packet=10000000000000000', (err) => {
//             if (err) {
//                 console.error('Error setting max_allowed_packet:', err);
//             }
//         });
//     }
// });

// module.exports = db;
 