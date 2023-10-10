import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import {fetchWrapper} from "@/packages/fetch-wrapper/fetch-wrapper";
import {TranscriptionSearchResult} from "@/packages/transcription-search/transcription-search-result.type";

export const searchEpisodeTranscriptionChunk = async (transcriptionId: string): Promise<TranscriptionSearchResult[]> => {
    // construct query parameters
    const searchParams = new URLSearchParams();
    searchParams.append('transcriptionId', transcriptionId);
    const url = `/api/transcriptions/chunk/next?${searchParams}`;

    return fetchWrapper<TranscriptionSearchResult[]>(url)
}
