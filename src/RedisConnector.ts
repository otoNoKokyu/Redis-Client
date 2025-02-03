import net from 'net';

type Options = {
    poolSize?: number;
};

type Pool = {
    idleConnections: Array<net.Socket>;
};

enum command {
    "GET" = 'Maal hain?',
    "SET" = 'Maal dalo'
}

export class RedisClient {
    private host: string;
    private port: number;
    private connectionPool: Pool;

    constructor(host: string = '127.0.0.1', port: number = 6379) {
        this.host = host;
        this.port = port;
        this.connectionPool = {
            idleConnections: [],
        };
    }

    private initializePool(poolSize: number = 2): void {
        for (let i = 0; i < poolSize; i++) {
            const socket = new net.Socket();
            this.connectionPool.idleConnections.push(socket);
        }
        console.info('Pool initialized', this.connectionPool.idleConnections.length);
    }

    private getConnection(): net.Socket {
        if (this.connectionPool.idleConnections.length === 0) {
            console.warn('No available connections in the pool.');
            return new net.Socket();
        }
        return this.connectionPool.idleConnections.pop()!;
    }

    private releaseConnection(socket: net.Socket): void {
        this.connectionPool.idleConnections.push(socket);
    }

    public async connect({ poolSize = 2 }: Options): Promise<void> {
        this.initializePool(poolSize);
        await Promise.all(
            this.connectionPool.idleConnections.map((conn) =>
                new Promise<void>((resolve, reject) => {
                    conn.connect(this.port, this.host, resolve);
                    conn.on('error', reject);
                })
            )
        );
        console.log(`Connected to Redis at ${this.host}:${this.port}`);
    }

    private async sendCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const conn = this.getConnection();

            conn.write(command + '\r\n');

            conn.once('data', (data) => {
                resolve(this.decodeResponse(data.toString()));
                this.releaseConnection(conn);
            });

            conn.once('error', (err) => {
                console.error(`Error sending command: ${err.message}`);
                reject(err);
            });
        });
    }

    private encodeCommand(command: string, ...args: string[]): string {
        const commandParts = [command, ...args];
        return `*${commandParts.length}\r\n` +
            commandParts.map(part => `$${part.length}\r\n${part}\r\n`).join('');
    }

    private decodeResponse(response: string): string {
        if (response.startsWith('$')) {
            const parts = response.split('\r\n');
            return parts.length > 1 ? parts[1] : '';
        } else if (response.startsWith('+')) {
            return response.substring(1).trim();
        } else if (response.startsWith('-')) {
            throw new Error(`Redis Error: ${response.substring(1).trim()}`);
        } else if (response.startsWith(':')) {
            return response.substring(1).trim();
        }
        return response;
    }

    public async GET(key: string) {
        return await this.sendCommand(this.encodeCommand('GET', key));
    }

    public async SET(key: string, val: string) {
        return await this.sendCommand(this.encodeCommand('SET', key, val));
    }

    public async REMOVE(key: string) {
        return await this.sendCommand(this.encodeCommand('DEL', key));
    }

    public disconnect(): void {
        this.connectionPool.idleConnections.forEach((conn) => {
            conn.end(() => console.log('Disconnected from Redis'));
        });
        this.connectionPool.idleConnections = [];
    }
}
