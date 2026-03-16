import { api } from './mockApi';
import type { ShortLink } from './mockApi';

export const linkService = {
    createShortLink: async (originalUrl: string, alias?: string): Promise<ShortLink> => {
        const response = await api.post('/links', { originalUrl, alias });
        return response.data;
    },

    getUserLinks: async (): Promise<ShortLink[]> => {
        const response = await api.get('/links');
        return response.data;
    },

    deleteLink: async (id: string): Promise<void> => {
        await api.delete(`/links/${id}`);
    }
};
