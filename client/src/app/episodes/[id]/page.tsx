import styles from './page.module.css'
import {notFound} from 'next/navigation'
import {getEpisodeDetails} from "@/packages/episode/episode.repository";

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

            <p>
                Published at: {episode.published_at.toLocaleDateString("en-US", {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })}
            </p>

            {episode.derived_summary && (
                <div>
                    <h3>Summary</h3>
                    <p>{episode.derived_summary}</p>
                </div>
            )}

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
