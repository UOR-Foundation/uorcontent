global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});
