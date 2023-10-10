import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import {fetchWrapper} from "@/packages/fetch-wrapper/fetch-wrapper";
import {TranscriptionSearchResult} from "@/packages/transcription-search/transcription-search-result.type";

export const searchEpisodeTranscription = async (searchQuery: string, episodeId: string): Promise<TranscriptionSearchResult[]> => {
    // construct query parameters
    const searchParams = new URLSearchParams();
    searchParams.append('episodeId', episodeId);
    searchParams.append('searchQuery', searchQuery.trim());
    const url = `/api/search/transcriptions?${searchParams}`;

    return fetchWrapper<TranscriptionSearchResult[]>(url)
}
