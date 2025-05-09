const { UORMCPServer } = require('./dist/index.js');

const server = new UORMCPServer();
server.run().catch(console.error);

module.exports = server;
