const mockAuth = {
  getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
  onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn().mockResolvedValue({}),
};

const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
  upsert: jest.fn().mockResolvedValue({}),
});

export const createClient = jest.fn(() => ({
  auth: mockAuth,
  from: mockFrom,
}));
