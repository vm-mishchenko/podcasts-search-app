import type {NextApiRequest, NextApiResponse} from 'next';
import {HTTP_STATUS_CODE, HTTP_METHOD} from "@/packages/http/http";
import {captureErrorsMiddleware} from "@/packages/middlewares/capture-errors.middleware";
import {use} from "@/packages/middleware/use";
import {allowMethodsMiddleware} from "@/packages/middlewares/allow-methods.middleware";
import {getMongoClient} from "@/packages/database/client";
import {ServiceError, ServiceErrorCode} from "@/packages/server-errors/service-errors";
import {TranscriptionSearchResult} from "@/packages/transcription-search/transcription-search-result.type";
import {ObjectId} from "mongodb";

const handler = async (req: NextApiRequest, res: NextApiResponse<TranscriptionSearchResult[]>) => {
    const transcriptionId = req.query['transcriptionId'] as string;

    if (!transcriptionId) {
        throw new ServiceError(ServiceErrorCode.MISSING_ATTRIBUTE({attrName: 'transcriptionId'}));
    }

    // Init MongoDb
    const client = await getMongoClient();
    const transcriptions = client.db('online').collection('transcriptions');

    // Fetch current transcription
    const transcription = await transcriptions.findOne({
        '_id': new ObjectId(transcriptionId!),
    });

    if (!transcription) {
        res.status(HTTP_STATUS_CODE.NOT_FOUND);
        return;
    }

    // Fetch next transcription
    const nextTranscriptionDocs = await transcriptions.find({
        episode_id: transcription['episode_id'],
        index: {
            "$in": [transcription['index'] + 1, transcription['index'] + 2, transcription['index'] + 3]
        }
    }, {
        sort: {
            'index': 1
        }
    }).toArray();

    // Convert mongodb doc to response type
    const transcriptionSearchResults = nextTranscriptionDocs.map((mongodbTranscription) => {
        const transcription: TranscriptionSearchResult = {
            _id: `${mongodbTranscription._id}`,
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
