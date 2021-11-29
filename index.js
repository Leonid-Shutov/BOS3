const { networkInterfaces } = require('os');
const find = require('local-devices');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const scanHosts = async cidr => await find(cidr);

const clearArp = async () => await exec('arp -d -a');

const getVirtulaAdapters = networkInterfaces =>
    Object.entries(networkInterfaces)
        .filter(([interface]) => /^(vboxnet|vmnet)/.test(interface))
        .map(([interface, info]) => ({
            name: interface,
            cidr: info[0].cidr,
            isConnected: false,
        }));

const turnOffWirelessNetwork = async () =>
    await exec('networksetup -setairportpower en0 off');

const turnOnWirelessNetwork = async () =>
    await exec('networksetup -setairportpower en0 on');

const printStats = virtualAdapters => {
    console.log('----------------------------------------------\n\n\n\n');
    virtualAdapters.forEach(adapter =>
        console.log(
            `${adapter.name} - cable ${
                adapter.isConnected ? `connected` : `disconnected`
            }`,
        ),
    );
};

let wiredAdaptersState = null;

const checkInterfaces = async () => {
    const interfaces = networkInterfaces();

    const virtualAdapters = getVirtulaAdapters(interfaces);

    try {
        if (virtualAdapters.length) {
            await clearArp();

            const results = await Promise.allSettled(
                virtualAdapters.map(adapter => scanHosts(adapter.cidr)),
            );

            results.forEach((hosts, index) => {
                virtualAdapters[index].isConnected = hosts.value.length > 2;
            });
        }
    } catch (e) {}

    if (
        JSON.stringify(wiredAdaptersState) !== JSON.stringify(virtualAdapters)
    ) {
        printStats(virtualAdapters);
        wiredAdaptersState = virtualAdapters;

        if (virtualAdapters.find(adapter => adapter.isConnected)) {
            await turnOffWirelessNetwork();
            console.log('wireless network - off');
        } else {
            await turnOnWirelessNetwork();
            console.log('wireless network - on');
        }
    }

    process.nextTick(checkInterfaces);
};

checkInterfaces();
