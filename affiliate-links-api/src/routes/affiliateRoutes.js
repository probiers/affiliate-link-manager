const express = require('express');
const router = express.Router();
const { getSession } = require('../db/neo4j');

// Create a new affiliate link
router.post('/', async (req, res) => {
    const session = getSession();
    try {
        const { originalUrl, affiliateUrl, merchant, category } = req.body;
        
        const result = await session.run(
            `
            CREATE (a:AffiliateLink {
                originalUrl: $originalUrl,
                affiliateUrl: $affiliateUrl,
                merchant: $merchant,
                category: $category,
                createdAt: datetime()
            })
            RETURN a
            `,
            { originalUrl, affiliateUrl, merchant, category }
        );
        
        res.status(201).json(result.records[0].get('a').properties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// Get all affiliate links
router.get('/', async (req, res) => {
    const session = getSession();
    try {
        const { merchant, category } = req.query;
        let query = 'MATCH (a:AffiliateLink)';
        const params = {};

        if (merchant) {
            query += ' WHERE a.merchant = $merchant';
            params.merchant = merchant;
        }
        
        if (category) {
            query += merchant ? ' AND' : ' WHERE';
            query += ' a.category = $category';
            params.category = category;
        }

        query += ' RETURN a ORDER BY a.createdAt DESC';

        const result = await session.run(query, params);
        const affiliateLinks = result.records.map(record => record.get('a').properties);
        
        res.json(affiliateLinks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// Get affiliate links by merchant
router.get('/merchant/:merchant', async (req, res) => {
    const session = getSession();
    try {
        const { merchant } = req.params;
        
        const result = await session.run(
            'MATCH (a:AffiliateLink) WHERE a.merchant = $merchant RETURN a',
            { merchant }
        );
        
        const affiliateLinks = result.records.map(record => record.get('a').properties);
        res.json(affiliateLinks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

// Delete an affiliate link
router.delete('/:affiliateUrl', async (req, res) => {
    const session = getSession();
    try {
        const { affiliateUrl } = req.params;
        
        await session.run(
            'MATCH (a:AffiliateLink {affiliateUrl: $affiliateUrl}) DELETE a',
            { affiliateUrl }
        );
        
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await session.close();
    }
});

module.exports = router; 