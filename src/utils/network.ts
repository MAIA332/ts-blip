import os from "os";

export class Network {

    public summary(): any {

        const cpus = os.cpus();

        const group_by = (arr: any[], key: any) => arr.reduce((acc: any, item: any) => (acc[item[key]] = (acc[item[key]] || []).concat(item), acc), {});

        const cpus_summary = group_by(cpus, "model");

        const summary = {
            "hostname": os.hostname(),
            "os": os.type(),
            "platform": os.platform(),
            "release": os.release(),
            "uptime": os.uptime(),
            "totalmem": os.totalmem(),
            "freemem": os.freemem(),
            "cpus": cpus_summary,
            "networkInterfaces": os.networkInterfaces(),
            "ip": this.getIPv4(),
            "ipv6": this.getIPv6(),
        }

        return summary
    }
    public isOnline(): boolean {
        const interfaces = os.networkInterfaces();
        for (const name in interfaces) {
            const iface = interfaces[name];
            if (iface) {
                for (const alias of iface) {
                    if (!alias.internal && alias.family === "IPv4") {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public getIPv4(): string[] {
        const ips: string[] = [];
        const interfaces = os.networkInterfaces();

        for (const name in interfaces) {
            const iface = interfaces[name];
            if (iface) {
                for (const alias of iface) {
                    if (alias.family === "IPv4" && !alias.internal) {
                        ips.push(alias.address);
                    }
                }
            }
        }
        return ips;
    }

    public getIPv6(): string[] {
        const ips: string[] = [];
        const interfaces = os.networkInterfaces();

        for (const name in interfaces) {
            const iface = interfaces[name];
            if (iface) {
                for (const alias of iface) {
                    if (alias.family === "IPv6" && !alias.internal) {
                        ips.push(alias.address);
                    }
                }
            }
        }
        return ips;
    }

    public getHostName(): string {
        return os.hostname();
    }
}
