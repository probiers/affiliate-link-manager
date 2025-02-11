const request = require('supertest');
const express = require('express');
const { getSession } = require('../../src/db/neo4j');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/affiliates', require('../../src/routes/affiliateRoutes'));

// Mock Neo4j session
jest.mock('../../src/db/neo4j', () => ({
    getSession: jest.fn()
}));

describe('Affiliate Routes', () => {
    let mockSession;

    beforeEach(() => {
        // Reset and setup mock for each test
        mockSession = {
            run: jest.fn(),
            close: jest.fn()
        };
        getSession.mockReturnValue(mockSession);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /', () => {
        it('should create a new affiliate link', async () => {
            const newLink = {
                affiliateUrl: 'https://example.com/ref123',
                tags: ['electronics', 'gadgets'],
                comment: 'Test comment'
            };

            // Mock checking for existing link
            mockSession.run.mockResolvedValueOnce({
                records: []
            });

            // Mock creating new link
            mockSession.run.mockResolvedValueOnce({
                records: [{
                    get: () => ({
                        properties: {
                            ...newLink,
                            sharedUrl: newLink.affiliateUrl,
                            merchant: 'amazon',
                            createdAt: '2024-01-01T00:00:00Z'
                        }
                    })
                }]
            });

            const response = await request(app)
                .post('/api/affiliates')
                .send(newLink);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('affiliateUrl', newLink.affiliateUrl);
            expect(response.body).toHaveProperty('tags', newLink.tags);
            expect(mockSession.close).toHaveBeenCalled();
        });

        it('should return 409 if affiliate link already exists', async () => {
            const existingLink = {
                affiliateUrl: 'https://example.com/ref123',
                tags: ['electronics']
            };

            mockSession.run.mockResolvedValueOnce({
                records: [{
                    get: () => ({
                        properties: existingLink
                    })
                }]
            });

            const response = await request(app)
                .post('/api/affiliates')
                .send(existingLink);

            expect(response.status).toBe(409);
            expect(response.body).toHaveProperty('error');
            expect(mockSession.close).toHaveBeenCalled();
        });
    });

    describe('GET /', () => {
        it('should get all affiliate links', async () => {
            const mockLinks = [{
                affiliateUrl: 'https://example.com/ref123',
                tags: ['electronics'],
                createdAt: '2024-01-01T00:00:00Z'
            }];

            mockSession.run.mockResolvedValueOnce({
                records: mockLinks.map(link => ({
                    get: () => ({
                        properties: link
                    })
                }))
            });

            const response = await request(app)
                .get('/api/affiliates');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(mockLinks.length);
            expect(mockSession.close).toHaveBeenCalled();
        });

        it('should filter affiliate links by tags', async () => {
            const mockLinks = [{
                affiliateUrl: 'https://example.com/ref123',
                tags: ['electronics'],
                createdAt: '2024-01-01T00:00:00Z'
            }];

            mockSession.run.mockResolvedValueOnce({
                records: mockLinks.map(link => ({
                    get: () => ({
                        properties: link
                    })
                }))
            });

            const response = await request(app)
                .get('/api/affiliates')
                .query({ tags: ['electronics'] });

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(mockLinks.length);
            expect(mockSession.close).toHaveBeenCalled();
        });
    });

    describe('GET /merchant/:merchant', () => {
        it('should get affiliate links by merchant', async () => {
            const mockLinks = [{
                affiliateUrl: 'https://example.com/ref123',
                merchant: 'amazon',
                tags: ['electronics']
            }];

            mockSession.run.mockResolvedValueOnce({
                records: mockLinks.map(link => ({
                    get: () => ({
                        properties: link
                    })
                }))
            });

            const response = await request(app)
                .get('/api/affiliates/merchant/amazon');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(mockLinks.length);
            expect(mockSession.close).toHaveBeenCalled();
        });
    });

    describe('DELETE /:affiliateUrl', () => {
        it('should delete an affiliate link', async () => {
            mockSession.run.mockResolvedValueOnce({
                records: []
            });

            const response = await request(app)
                .delete('/api/affiliates/https%3A%2F%2Fexample.com%2Fref123');

            expect(response.status).toBe(204);
            expect(mockSession.close).toHaveBeenCalled();
        });
    });
}); 