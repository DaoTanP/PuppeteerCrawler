const express = require('express');
const router = express.Router();
const { Web } = require('../models/web');

router.route('/')
  .get(async (req, res) => {
    try {
      const term = req.query.term;

      const results = await Web.find(
        { $text: { $search: term } },
        { score: { $meta: "textScore" } }
      ).sort(
        { score: { $meta: "textScore" } }
      );

      res.json(results);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

router.route('/test')
  .get(async (req, res) => {
    try {
      let result = await Web.aggregate([
        {
          "$search": {
            "text": {
              "query": `${req.query.term}`,
              "path": ["title", "content"],
              "fuzzy": {
                "maxEdits": 2
              }
            },
            "highlight": {
              "path": "content"
            }
          }
        },
        {
          "$addFields": {
            "highlights": {
              "$meta": "searchHighlights"
            },
            "textScore": {
              "$meta": "textScore"
            }
          }
        },
        {
          "$sort": {
            "score": {
              "$meta": "textScore"
            }
          }
        },
        {
          "$limit": 100
        }
      ]);

      res.send(result);
    } catch (e) {
      res.status(500).send({ message: e.message });
    }
  })

module.exports = router;