import net from 'net';


export class RedisClient {
    private client: net.Socket;
    private host: string;
    private port: number;

    constructor(host: string = '127.0.0.1', port: number = 6379) {
        this.host = host;
        this.port = port;
        this.client = new net.Socket();
    }

    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.connect(this.port, this.host, () => {
                console.log(`Connected to Redis at ${this.host}:${this.port}`);
                resolve();
            });

            this.client.on('error', (err) => {
                console.error(`Redis connection error: ${err.message}`);
                reject(err);
            });
        });
    }

    public sendCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.client.write(command);

            this.client.once('data', (data) => {
                resolve(data.toString());
            });

            this.client.once('error', (err) => {
                reject(err);
            });
        });
    }

    public disconnect(): void {
        this.client.end(() => {
            console.log('Disconnected from Redis');
        });
    }
}