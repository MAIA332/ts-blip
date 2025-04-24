"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Network = void 0;
const os_1 = __importDefault(require("os"));
class Network {
    summary() {
        const cpus = os_1.default.cpus();
        const group_by = (arr, key) => arr.reduce((acc, item) => (acc[item[key]] = (acc[item[key]] || []).concat(item), acc), {});
        const cpus_summary = group_by(cpus, "model");
        const summary = {
            "hostname": os_1.default.hostname(),
            "os": os_1.default.type(),
            "platform": os_1.default.platform(),
            "release": os_1.default.release(),
            "uptime": os_1.default.uptime(),
            "totalmem": os_1.default.totalmem(),
            "freemem": os_1.default.freemem(),
            "cpus": cpus_summary,
            "networkInterfaces": os_1.default.networkInterfaces(),
            "ip": this.getIPv4(),
            "ipv6": this.getIPv6(),
        };
        return summary;
    }
    isOnline() {
        const interfaces = os_1.default.networkInterfaces();
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
    getIPv4() {
        const ips = [];
        const interfaces = os_1.default.networkInterfaces();
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
    getIPv6() {
        const ips = [];
        const interfaces = os_1.default.networkInterfaces();
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
    getHostName() {
        return os_1.default.hostname();
    }
}
exports.Network = Network;
