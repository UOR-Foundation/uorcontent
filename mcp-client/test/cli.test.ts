import { Command } from 'commander';
import { UORMCPServer } from '../src/index';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');
jest.mock('@modelcontextprotocol/sdk/types.js');

// Mock UORMCPServer
const mockRun = jest.fn().mockResolvedValue(undefined);
const mockUORMCPServer = jest.fn().mockImplementation(() => ({
  run: mockRun
}));

jest.mock('../src/index', () => ({
  UORMCPServer: mockUORMCPServer
}));

// Create mock objects for commander
const mockCommand = {
  description: jest.fn().mockReturnThis(),
  option: jest.fn().mockReturnThis(),
  action: jest.fn().mockImplementation(function(fn) {
    mockCommand.actionFn = fn;
    return mockCommand;
  }),
  actionFn: null
};

const mockProgram = {
  name: jest.fn().mockReturnThis(),
  description: jest.fn().mockReturnThis(),
  version: jest.fn().mockReturnThis(),
  command: jest.fn().mockReturnValue(mockCommand),
  parse: jest.fn(),
  outputHelp: jest.fn()
};

jest.mock('commander', () => ({
  Command: jest.fn().mockImplementation(() => mockProgram)
}));

describe('CLI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset modules to clear any cached instances
    jest.resetModules();
    
    // Mock process.argv.slice
    jest.spyOn(process.argv, 'slice').mockReturnValue([]);
  });
  
  afterEach(() => {
    // Restore process.argv.slice
    jest.restoreAllMocks();
  });
  
  it('should create a program with name, description, and version', () => {
    // Import the CLI module
    require('../src/cli');
    
    expect(mockProgram.name).toHaveBeenCalledWith('uor-mcp');
    expect(mockProgram.description).toHaveBeenCalledWith('UOR MCP client');
    expect(mockProgram.version).toHaveBeenCalledWith('0.1.0');
  });
  
  it('should add a start command with options', () => {
    // Import the CLI module
    require('../src/cli');
    
    expect(mockProgram.command).toHaveBeenCalledWith('start');
    expect(mockCommand.description).toHaveBeenCalledWith('Start the UOR MCP server');
    expect(mockCommand.option).toHaveBeenCalledWith('-u, --url <url>', 'UOR API URL (default: https://uor.foundation/mcp)');
    expect(mockCommand.option).toHaveBeenCalledWith('-k, --api-key <key>', 'API key for authentication');
    expect(mockCommand.option).toHaveBeenCalledWith('-t, --timeout <ms>', 'Request timeout in milliseconds', '30000');
  });
  
  it('should create and run a server when the start command is executed', () => {
    // Clear previous mock calls
    jest.clearAllMocks();
    
    // Import the CLI module to register the command
    require('../src/cli');
    
    // Get the action function that was registered
    const actionFn = mockCommand.action.mock.calls[0][0];
    
    // Call the action function with test options
    actionFn({
      url: 'https://test-api.example.com',
      apiKey: 'test-api-key',
      timeout: '5000'
    });
    
    // Verify UORMCPServer constructor was called with the right config
    expect(mockUORMCPServer).toHaveBeenCalledWith({
      baseUrl: 'https://test-api.example.com',
      apiKey: 'test-api-key',
      timeout: 5000
    });
    
    // Verify run was called on the server instance
    expect(mockRun).toHaveBeenCalled();
  });
  
  it('should parse command line arguments', () => {
    // Import the CLI module
    require('../src/cli');
    
    expect(mockProgram.parse).toHaveBeenCalledWith(process.argv);
  });
  
  it('should show help if no command is provided', () => {
    // Import the CLI module
    require('../src/cli');
    
    expect(mockProgram.outputHelp).toHaveBeenCalled();
  });
});
