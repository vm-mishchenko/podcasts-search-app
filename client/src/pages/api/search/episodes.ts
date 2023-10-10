import type {NextApiRequest, NextApiResponse} from 'next';
import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import {HTTP_STATUS_CODE, HTTP_METHOD} from "@/packages/http/http";
import {captureErrorsMiddleware} from "@/packages/middlewares/capture-errors.middleware";
import {use} from "@/packages/middleware/use";
import {allowMethodsMiddleware} from "@/packages/middlewares/allow-methods.middleware";
import {getMongoClient} from "@/packages/database/client";

const handler = async (req: NextApiRequest, res: NextApiResponse<EpisodeSearchResult[]>) => {
    const searchQuery = req.query['searchQuery'];

    if (!searchQuery) {
        res.status(HTTP_STATUS_CODE.OK);
        res.json([]);
        return;
    }

    // Fetch data from MongoDb
    const client = await getMongoClient();
    const episodes = client.db('online').collection('episodes');
    const mongodbEpisodesResults = await episodes.aggregate([
        {
            "$search": {
                "compound": {
                    "should": [
                        {
                            // text: https://www.mongodb.com/docs/atlas/atlas-search/text/
                            "text": {
                                "query": searchQuery,
                                "path": "title",
                                "score": {"boost": {"value": 3}}
                            }
                        },
                        {
                            "text": {
                                "query": searchQuery,
                                "path": "derived_summary",
                                "score": {"boost": {"value": 2}}
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
                "title": 1
            }
        }
    ]).toArray();

    // Convert mongodb doc to response type
    const episodeSearchResults = mongodbEpisodesResults.map((mongodbEpisode) => {
        const episode: EpisodeSearchResult = {
            _id: mongodbEpisode._id,
            title: mongodbEpisode['title'],
            derived_summary: mongodbEpisode['derived_summary']
        };

        return episode;
    })

    res.status(HTTP_STATUS_CODE.OK);
    res.json(episodeSearchResults);
};

export default use(captureErrorsMiddleware, allowMethodsMiddleware([HTTP_METHOD.GET]), handler);
