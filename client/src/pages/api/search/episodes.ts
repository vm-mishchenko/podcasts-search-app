import type {NextApiRequest, NextApiResponse} from 'next';
import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import {HTTP_STATUS_CODE, HTTP_METHOD} from "@/packages/http/http";
import {captureErrorsMiddleware} from "@/packages/middlewares/capture-errors.middleware";
import {use} from "@/packages/middleware/use";
import {allowMethodsMiddleware} from "@/packages/middlewares/allow-methods.middleware";
import {getMongoClient} from "@/packages/database/client";

const handler = async (req: NextApiRequest, res: NextApiResponse<EpisodeSearchResult[]>) => {
    const searchQuery = req.query['searchQuery'] as string;

    if (!searchQuery) {
        res.status(HTTP_STATUS_CODE.OK);
        res.json([]);
        return;
    }

    // Fetch data from MongoDb
    const client = await getMongoClient();
    const episodes = client.db('online').collection('episodes');
    const oneMonthInMilliseconds = 2592000000;
    const aggregationPipeline: any = [
        {
            "$search": {
                "compound": {
                    "must": [],
                    "should": [
                        {
                            // text: https://www.mongodb.com/docs/atlas/atlas-search/text/
                            "text": {
                                "query": searchQuery,
                                "path": "title",
                                "score": {
                                    "boost": {
                                        "value": 3
                                    }
                                }
                            }
                        },
                        // boost newer episodes
                        {
                            // https://www.mongodb.com/docs/atlas/atlas-search/near
                            'near': {
                                'path': 'published_at',
                                'origin': new Date(),
                                // must be specified in milliseconds for date data type
                                'pivot': oneMonthInMilliseconds * 12, // one year
                                'score': {
                                    'boost': {
                                        'value': 4
                                    }
                                }
                            }
                        },
                        {
                            "text": {
                                "query": searchQuery,
                                "path": "derived_summary",
                                "score": {
                                    "boost": {
                                        "value": 2
                                    }
                                }
                            }
                        },
                        {
                            "text": {
                                "query": searchQuery,
                                "path": "derived_transcription_text"
                            }
                        }
                    ]
                }
            }
        },
        {
            $limit: 20
        },
        {
            $project: {
                "title": 1,
                "published_at": 1,
                "derived_summary": 1
            }
        }
    ];

    const exactMatchQuery = extractExactMatch(searchQuery);
    if (exactMatchQuery) {
        const mustClause = {
            // text: https://www.mongodb.com/docs/atlas/atlas-search/phrase
            "phrase": {
                "query": exactMatchQuery,
                "path": {"value": "title", "multi": "title_standard"}
            }
        };

        aggregationPipeline[0]['$search']['compound']['must'].push(mustClause);
    }

    const mongodbEpisodesResults = await episodes.aggregate(aggregationPipeline).toArray();

    // Convert mongodb doc to response type
    const episodeSearchResults = mongodbEpisodesResults.map((mongodbEpisode) => {
        const episode: EpisodeSearchResult = {
            _id: mongodbEpisode._id,
            title: mongodbEpisode['title'],
            published_at: mongodbEpisode['published_at'],
            derived_summary: mongodbEpisode['derived_summary'] // no need for search result page at this moment
        };

        return episode;
    })

    res.status(HTTP_STATUS_CODE.OK);
    res.json(episodeSearchResults);
};

const extractExactMatch = (searchQuery: string): string | undefined => {
    const split = searchQuery.split('"');

    if (split.length >= 3) {
        const exactMatchQuery = split[1].trim();
        if (exactMatchQuery.length) {
            return exactMatchQuery;
        }
    }
}

export default use(captureErrorsMiddleware, allowMethodsMiddleware([HTTP_METHOD.GET]), handler);
