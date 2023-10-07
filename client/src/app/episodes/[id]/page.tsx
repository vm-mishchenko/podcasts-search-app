import {ObjectId} from "mongodb";
import {getMongoClient} from "@/packages/database/client";
import {Episode} from "@/packages/episode/episode.type";
import styles from './page.module.css'
import {notFound} from 'next/navigation'
import {Transcription} from "@/packages/transcription/transcription.type";

interface EpisodeDetails {
    episode: Episode;
    transcription: Transcription;
}

export default async function Page({params: {id}}: { params: { id: string } }) {
    const result = await getEpisodeDetails(id);

    if (!result) {
        notFound();
    }

    const {episode, transcription} = result;

    return (
        <main className={styles.main}>
            <h2>{episode.title}</h2>
            <p>
                <a target="_blank" href={episode.episode_link}>Episode link</a>
            </p>

            <p>Published at: {episode.published_at}</p>
            <div>
                <h3>Summary</h3>
                <p>{episode.derived_summary}</p>
            </div>

            <div>
                <h3>Transcription</h3>

                <ul>
                    {transcription.map((transcriptionChunk, index) => {
                        return <li key={index}>
                            {transcriptionChunk.text}
                        </li>
                    })}
                </ul>
            </div>
        </main>
    )
}

async function getEpisodeDetails(id: string): Promise<EpisodeDetails | undefined> {
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
            'episode_id': id
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

