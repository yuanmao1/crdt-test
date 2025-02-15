export class Network {
  channelMap: Map<string, Channel>;
  delay: number;
  enable: boolean;

  public constructor(delay: number = 300, enable: boolean = true) {
    this.channelMap = new Map();
    this.delay = delay;
    this.enable = enable;
  }

  public createChannel(name: string): Channel {
    const channel = new Channel(name, this);
    this.channelMap.set(name, channel);
    return channel;
  }

  public getChannel(name: string): Channel | undefined {
    return this.channelMap.get(name);
  }

  public removeChannel(name: string): void {
    this.channelMap.delete(name);
  }

  public setDelay(i: number) {
    this.delay = i;
  }

  public setEnable(b: boolean) {
    this.enable = b;
  }

  public getEnable() {
    return this.enable;
  }
}

export type ReceiveCb = (message: string) => void;

export class Channel {
  name: string;
  network: Network;
  receiveCbs: ReceiveCb[];

  public constructor(name: string, network: Network) {
    this.name = name;
    this.network = network;
    this.receiveCbs = [];
  }

  public send(channelName: string, message: string) {
    const channel = this.network.getChannel(channelName);
    if (channel) {
      channel.write(message);
    } else {
      throw new Error(`Channel ${channelName} not found`);
    }
  }

  public broadcast(message: string) {
    for (const [name, channel] of this.network.channelMap.entries()) {
      if (name === this.name) {
        continue;
      }
      channel.write(message);
    }
  }

  public receive(cb: ReceiveCb): void {
    this.receiveCbs.push(cb);
  }

  public write(message: string) {
    setTimeout(() => {
      if (this.network.getEnable()) {
        this.receiveCbs.forEach((cb) => cb(message));
      }
    }, this.network.delay);
  }
}

export const defaultNetwork = new Network();