import {fetchWrapper} from "@/packages/fetch-wrapper/fetch-wrapper";
import {EpisodeSearchResponse} from "@/pages/api/search/episodes";
import {Filter} from "@/packages/filters/filters.type";
import {FacetName, BucketId} from "@/packages/sdk/mongodb/search-meta/search-meta.types";
import {SelectedFacet} from "@/packages/sdk/ui/sdk-ui-facets";

let currentFetch: any;
const abortableFetch = (url: string) => {
    const controller = new AbortController();
    const signal = controller.signal;

    return {
        abort: () => controller.abort(),
        ready: fetchWrapper<EpisodeSearchResponse>(url, {signal})
    };
};

export const searchEpisodes = async (searchQuery: string, filters: Filter[], selectedFacets: SelectedFacet[]): Promise<EpisodeSearchResponse> => {
    // abort previous in-flight request
    if (!!currentFetch) {
        currentFetch.abort();
        currentFetch = null;
    }

    // construct query parameters
    const searchParams = new URLSearchParams();
    searchParams.append('searchQuery', searchQuery.trim());
    searchParams.append('filters', JSON.stringify(filters));
    searchParams.append('facets', JSON.stringify(selectedFacets));
    const url = `/api/search/episodes?${searchParams}`;

    // fetch data
    currentFetch = abortableFetch(url);
    const response = await currentFetch!.ready;
    currentFetch = null;
    return response;
}
