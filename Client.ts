import { RedisCommandBuilder } from "./RedisCommandBuilder";
import { RedisClient } from "./RedisConnector";

const redisBuilder = new RedisCommandBuilder();
const redisClient = new RedisClient();

(async () => {
    try {
        await redisClient.connect();

        const setResponse = await redisClient.sendCommand(redisBuilder.SET('arko', 'chaaal'));
        console.log('SET Response:', setResponse);

        const getResponse = await redisClient.sendCommand(redisBuilder.GET('arko'));
        console.log('GET Response:', getResponse);

        const removeResponse = await redisClient.sendCommand(redisBuilder.REMOVE('myKey'));
        console.log('REMOVE Response:', removeResponse);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        redisClient.disconnect();
    }
})();
