import {useEffect, useState} from "react";
import {searchEpisodeTranscription} from "@/packages/api/episode-transcription-search-api";
import {TranscriptionSearchResult} from "@/packages/transcription-search/transcription-search-result.type";
import {searchEpisodeTranscriptionChunk} from "@/packages/api/next-transcription";
import styles from './EpisodeTranscription.module.css';

export interface EpisodeTranscriptionProps {
    searchQuery: string;
    episode_id: string;
}

export const EpisodeTranscription = ({searchQuery, episode_id}: EpisodeTranscriptionProps) => {
    const [transcriptionSearchResults, setTranscriptionSearchResults] = useState<Map<string, TranscriptionSearchResult[]>>(new Map())

    const onNext = (transcriptionSearchResult: TranscriptionSearchResult) => {
        const transcriptionSearchResultList = transcriptionSearchResults.get(transcriptionSearchResult._id);
        if (!transcriptionSearchResultList) {
            // should not happen in theory
            return;
        }

        const lastTranscriptionSearchResult = transcriptionSearchResultList[transcriptionSearchResultList.length - 1]

        searchEpisodeTranscriptionChunk(lastTranscriptionSearchResult._id).then((chunks) => {
            const transcriptionSearchResultList = transcriptionSearchResults.get(transcriptionSearchResult._id);
            transcriptionSearchResultList?.push(...chunks);
            setTranscriptionSearchResults(new Map(transcriptionSearchResults));
        }).catch((error) => {
            console.error(error);
        })
    }

    useEffect(() => {
        searchEpisodeTranscription(searchQuery, episode_id).then((transcriptionSearchResults) => {
            const result = new Map();

            transcriptionSearchResults.forEach((transcriptionSearchResult) => {
                result.set(transcriptionSearchResult._id, [transcriptionSearchResult]);
            });

            setTranscriptionSearchResults(result);
        }).catch((error: any) => {
            console.error(error)
        }).finally(() => {
        });
    }, [searchQuery]);

    return <div className={styles.root}>
        <h4 className={styles.header}>Transcription</h4>

        <ul className={styles.transcriptionChunks}>
            {Array.from(transcriptionSearchResults.values()).map((transcriptionSearchResultList, index) => {
                return <li key={index} className={styles.transcriptionChunk}>
                    <div className={styles.chunkControl}>
                        <p className={styles.chunkTime}>
                            <em>
                                {`${transcriptionSearchResultList[0].start.slice(0, 5)}  `}
                            </em>
                        </p>
                        <button onClick={() => {
                            onNext(transcriptionSearchResultList[0])
                        }}>next
                        </button>
                    </div>
                    <div>
                        <p className={styles.chunkText}>
                            {transcriptionSearchResultList.map((transcriptionSearchResult, index) => {
                                return `${transcriptionSearchResult.text} `
                            })}
                        </p>

                    </div>
                </li>
            })}
        </ul>
    </div>
}
