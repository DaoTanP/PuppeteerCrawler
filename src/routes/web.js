const express = require('express');
const router = express.Router();
const { Web } = require('../models/web');

router.route('/')
  .get(async (req, res) => {
    try {
      const term = req.query.term;

      const results = await Web.find(
        // { "content": term }
        { $text: { $search: term } },
        { score: { $meta: "textScore" } }
      ).sort(
        { score: { $meta: "textScore" } }
      ).limit(50).lean();

      res.json(results);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

router.route('/search')
  .get(async (req, res) => {
    try {
      let result = await Web.aggregate([
        {
          $match: {
            $text: {
              $search: `${req.query.term}`
            }
          }
        },
        // {
        //   $search: {
        //     index: 'content_text_title_text',
        //     text: {
        //       query: `${req.query.term}`,
        //       path: ["title", "content"],
        //       // fuzzy: {
        //       //   maxEdits: 2
        //       // }
        //     },
        //     // highlight: {
        //     //   path: "content"
        //     // }
        //   }
        // },
        // {
        //   $addFields: {
        //     highlights: {
        //       $meta: "searchHighlights"
        //     },
        //     textScore: {
        //       $meta: "textScore"
        //     }
        //   }
        // },
        {
          $sort: {
            score: {
              $meta: "textScore"
            }
          }
        },
        {
          $limit: 100
        }
      ]).exec();

      res.send(result);
    } catch (e) {
      res.status(500).send({ message: e.message });
    }
  })

module.exports = router;