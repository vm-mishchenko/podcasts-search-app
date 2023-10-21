import 'server-only';

import {ObjectId} from "mongodb";
import {getMongoClient} from "@/packages/database/client";
import {Episode} from "@/packages/episode/episode.type";
import {Transcription} from "@/packages/transcription/transcription.type";

export interface EpisodeDetails {
    episode: Episode;
    transcription: Transcription;
}

export const getEpisodeDetails = async (id: string): Promise<EpisodeDetails | undefined> => {
    try {
        // new ObjectId(id) can throw an error when "id" has invalid format
        const _id = new ObjectId(id);
        const client = await getMongoClient();
        const episodes = client.db('online').collection('episodes');
        const transcriptions = client.db('online').collection('transcriptions');
        const mongodbEpisode = await episodes.findOne({
            _id
        });

        if (!mongodbEpisode) {
            return;
        }

        const mongodbTranscription = await transcriptions.find({
            'episode_id': new ObjectId(id)
        }, {
            sort: {
                'start': 1
            }
        }).toArray();
        if (!mongodbTranscription) {
            return;
        }

        const episode: Episode = {
            _id: `${mongodbEpisode['_id']}`,
            title: mongodbEpisode['title'],
            audio_url: mongodbEpisode['audio_url'],
            episode_link: mongodbEpisode['episode_link'],
            published_at: mongodbEpisode['published_at'],
            derived_summary: mongodbEpisode['derived_summary']
        };

        const transcription: Transcription = mongodbTranscription as unknown as Transcription;

        return {
            episode,
            transcription
        };
    } catch (e) {
        return;
    }
}
