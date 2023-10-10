import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import {fetchWrapper} from "@/packages/fetch-wrapper/fetch-wrapper";

let currentFetch: any;
const abortableFetch = (url: string) => {
    const controller = new AbortController();
    const signal = controller.signal;

    return {
        abort: () => controller.abort(),
        ready: fetchWrapper<EpisodeSearchResult[]>(url, {signal})
    };
};

export const searchEpisodes = async (searchQuery: string): Promise<EpisodeSearchResult[]> => {
    // abort previous in-flight request
    if (!!currentFetch) {
        currentFetch.abort();
        currentFetch = null;
    }

    // construct query parameters
    const searchParams = new URLSearchParams();
    searchParams.append('searchQuery', searchQuery.trim());
    const url = `/api/search/episodes?${searchParams}`;

    // fetch data
    currentFetch = abortableFetch(url);
    const response = await currentFetch!.ready;
    currentFetch = null;
    return response;
}
