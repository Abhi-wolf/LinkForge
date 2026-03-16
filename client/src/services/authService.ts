// Mock auth calls
export const authService = {
    login: async (email: string, password: string): Promise<{ token: string, user: any }> => {
        // simulate delay
        await new Promise(r => setTimeout(r, 600));
        if (email && password.length >= 6) {
            return { token: 'mock-jwt-token', user: { name: 'Demo User', email } };
        }
        throw new Error('Invalid credentials');
    },
    register: async (email: string, password: string): Promise<{ token: string, user: any }> => {
        await new Promise(r => setTimeout(r, 600));
        if (email && password.length >= 6) {
            return { token: 'mock-jwt-token', user: { name: 'New User', email } };
        }
        throw new Error('Registration failed');
    }
}
