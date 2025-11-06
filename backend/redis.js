import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: 11836
    }
});

client.on('error', (err) => console.log('Redis Client Error', err));

export default client;












// import { createClient } from 'redis';

// const client = createClient({
//     username: process.env.REDIS_USERNAME,
//     password: process.env.REDIS_PASSWORD,
//     socket: {
//         host: REDIS_HOST,
//         port: REDIS_PORT
//     }
// });

// client.on('error', err => console.log('Redis Client Error', err));

// await client.set('key', 'value');
// const value = await client.get('key');
// console.log(value); // >>> value

// await client.connect();

// await client.set('foo', 'bar');
// const result = await client.get('foo');
// console.log(result) 

