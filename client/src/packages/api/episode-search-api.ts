import {fetchWrapper} from "@/packages/fetch-wrapper/fetch-wrapper";
import {EpisodeSearchResponse} from "@/pages/api/search/episodes";

let currentFetch: any;
const abortableFetch = (url: string) => {
    const controller = new AbortController();
    const signal = controller.signal;

    return {
        abort: () => controller.abort(),
        ready: fetchWrapper<EpisodeSearchResponse>(url, {signal})
    };
};

export const searchEpisodes = async (searchQuery: string): Promise<EpisodeSearchResponse> => {
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
