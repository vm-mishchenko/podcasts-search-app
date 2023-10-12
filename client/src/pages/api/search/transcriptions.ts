import type {NextApiRequest, NextApiResponse} from 'next';
import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import {HTTP_STATUS_CODE, HTTP_METHOD} from "@/packages/http/http";
import {captureErrorsMiddleware} from "@/packages/middlewares/capture-errors.middleware";
import {use} from "@/packages/middleware/use";
import {allowMethodsMiddleware} from "@/packages/middlewares/allow-methods.middleware";
import {getMongoClient} from "@/packages/database/client";
import {ServiceError, ServiceErrorCode} from "@/packages/server-errors/service-errors";
import {TranscriptionSearchResult} from "@/packages/transcription-search/transcription-search-result.type";
import {ObjectId} from "mongodb";

const handler = async (req: NextApiRequest, res: NextApiResponse<TranscriptionSearchResult[]>) => {
    const searchQuery = req.query['searchQuery'];
    const episodeId = req.query['episodeId'] as string;

    if (!searchQuery) {
        throw new ServiceError(ServiceErrorCode.MISSING_ATTRIBUTE({attrName: 'searchQuery'}));
    }
    if (!episodeId) {
        throw new ServiceError(ServiceErrorCode.MISSING_ATTRIBUTE({attrName: 'episodeId'}));
    }

    // Fetch data from MongoDb
    const client = await getMongoClient();
    const transcriptions = client.db('online').collection('transcriptions');
    const aggregationPipeline = [
        {
            "$search": {
                "compound": {
                    "must": [
                        {
                            // text: https://www.mongodb.com/docs/atlas/atlas-search/text/
                            "text": {
                                "query": searchQuery,
                                "path": "text",
                            }
                        }
                    ],
                    "filter": [{
                        "equals": {
                            "value": new ObjectId(episodeId),
                            "path": "episode_id"
                        }
                    }]
                }
            }
        },
        {
            "$limit": 3
        },
        {
            '$sort': {
                index: 1
            }
        }
    ];
    const mongodbTranscriptionsResults = await transcriptions.aggregate(aggregationPipeline).toArray();

    // Convert mongodb doc to response type
    const transcriptionSearchResults = mongodbTranscriptionsResults.map((mongodbTranscription) => {
        const transcription: TranscriptionSearchResult = {
            _id: mongodbTranscription._id,
            text: mongodbTranscription['text'],
            start: mongodbTranscription['start'],
            end: mongodbTranscription['end'],
            episode_id: mongodbTranscription['episode_id'],
            podcast_id: mongodbTranscription['podcast_id'],
        };

        return transcription;
    })

    res.status(HTTP_STATUS_CODE.OK);
    res.json(transcriptionSearchResults);
};

export default use(captureErrorsMiddleware, allowMethodsMiddleware([HTTP_METHOD.GET]), handler);
