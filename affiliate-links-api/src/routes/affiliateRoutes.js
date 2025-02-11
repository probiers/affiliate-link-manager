const express = require('express');
const router = express.Router();
const { getSession } = require('../db/neo4j');

// Create a new affiliate link
router.post('/', async (req, res) => {
    const session = getSession();
    try {
        const { affiliateUrl, tags, comment } = req.body;

        // Check if affiliate link with these tags already exists
        const existingLinkResult = await session.run(
            `
            MATCH (a:AffiliateLink)
            WHERE a.affiliateUrl = $affiliateUrl OR 
                  all(tag IN $tags WHERE tag IN a.tags)
            RETURN a
            `,
            { affiliateUrl, tags }
        );

        if (existingLinkResult.records.length > 0) {
            return res.status(409).json({
                error: 'Affiliate link or the given tags already exists',
                existingLink: existingLinkResult.records[0].get('a').properties
            });
        }

        const sharedUrl = affiliateUrl; // TODO: add more logic to generate sharedUrl
        const merchant = "amazon"; // TODO: add more logic to generate merchant

        const result = await session.run(
            `
            CREATE (a:AffiliateLink {
                sharedUrl: $sharedUrl,
                affiliateUrl: $affiliateUrl,
                merchant: $merchant,
                tags: $tags,
                comment: $comment,
                createdAt: datetime()
            })
            RETURN a
            `,
            { sharedUrl, affiliateUrl, merchant, tags, comment }
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
        const { tags } = req.query;
        let query = 'MATCH (a:AffiliateLink)';
        const params = {};

        if (tags && tags.length > 0) {
            query += ' WHERE any(tag IN a.tags WHERE tag IN $tags)';
            params.tags = tags;
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