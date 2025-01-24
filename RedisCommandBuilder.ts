
export class RedisCommandBuilder {
    constructor() {}

    private encodeCommand(command: string, ...args: string[]): string {
        const commandParts = [command, ...args];
        const encoded = `*${commandParts.length}\r\n` +
            commandParts.map(part => `$${part.length}\r\n${part}\r\n`).join('');
        return encoded;
    }

    public GET(key: string): string {
        return this.encodeCommand('GET', key);
    }

    public SET(key: string, val: string): string {
        return this.encodeCommand('SET', key, val);
    }

    public REMOVE(key: string): string {
        return this.encodeCommand('DEL', key);
    }
}





