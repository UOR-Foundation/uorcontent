const { UORMCPServer } = require('./dist/index');

const server = new UORMCPServer();
server.run().catch(console.error);

module.exports = server;
