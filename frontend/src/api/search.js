import client from './client';
export const semanticSearch = (query, top_k = 5) => client.post('/search', { query, top_k });
