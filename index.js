const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Retrieve API credentials from environment variables
const API_KEY = process.env.API_KEY; // Your API Key
const X_AUTH_EMAIL = process.env.X_AUTH_EMAIL; // Your Cloudflare email
const ZONE_ID = process.env.ZONE_ID; // Your Cloudflare zone ID

// Function to fetch domain info
async function getDomainInfo() {
    const fetch = (await import('node-fetch')).default; // Dynamic import
    const url = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}`;
    const headers = {
        'X-Auth-Key': API_KEY,
        'X-Auth-Email': X_AUTH_EMAIL,
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) {
            throw new Error(`Error fetching domain info: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Domain Information:');
        console.log(`- Name: ${data.result.name}`);
        console.log(`- Status: ${data.result.status}`);
        console.log(`- Type: ${data.result.type}`);
        console.log(`- Created On: ${data.result.created_on}`);
        console.log(`- Modified On: ${data.result.modified_on}`);
        console.log(`- Name Servers: ${data.result.name_servers.join(', ')}`);
        console.log(`- Original Registrar: ${data.result.original_registrar}`);
        console.log(`- Plan: ${data.result.plan.name}`);
    } catch (error) {
        console.error(error.message);
    }
}

// Function to fetch Firewall events
async function getFirewallEvents() {
    const fetch = (await import('node-fetch')).default; // Dynamic import
    const url = 'https://api.cloudflare.com/client/v4/graphql';
    const query = {
        query: `
            query ListFirewallEvents($zoneTag: String!, $filter: FirewallEventsAdaptiveFilter_InputObject) {
                viewer {
                    zones(filter: { zoneTag: $zoneTag }) {
                        firewallEventsAdaptive(filter: $filter, limit: 10, orderBy: [datetime_DESC]) {
                            action
                            clientAsn
                            clientCountryName
                            clientIP
                            clientRequestPath
                            clientRequestQuery
                            datetime
                            source
                            userAgent
                        }
                    }
                }
            }
        `,
        variables: {
            zoneTag: ZONE_ID,
            filter: {
                datetime_geq: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
                datetime_leq: new Date().toISOString() // Now
            }
        }
    };

    const headers = {
        'X-Auth-Key': API_KEY,
        'X-Auth-Email': X_AUTH_EMAIL,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(query)
        });
        if (!response.ok) {
            throw new Error(`Error fetching Firewall events: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Firewall Events:');
        data.data.viewer.zones[0].firewallEventsAdaptive.forEach(event => {
            console.log(`- Action: ${event.action}`);
            console.log(`  Client IP: ${event.clientIP}`);
            console.log(`  DateTime: ${event.datetime}`);
            console.log(`  User Agent: ${event.userAgent}`);
            console.log(`  Request Path: ${event.clientRequestPath}`);
            console.log(`  Request Query: ${event.clientRequestQuery}`);
            console.log(`  Source: ${event.source}`);
            console.log('-----------------------------------');
        });
    } catch (error) {
        console.error(`Failed to fetch Firewall events: ${error.message}`);
    }
}

// Execute the functions
getDomainInfo();
getFirewallEvents();
