import type {NextApiRequest, NextApiResponse} from 'next';
import {EpisodeSearchResult} from "@/packages/episode-search/episode-search-result.type";
import {HTTP_STATUS_CODE, HTTP_METHOD} from "@/packages/http/http";
import {captureErrorsMiddleware} from "@/packages/middlewares/capture-errors.middleware";
import {use} from "@/packages/middleware/use";
import {allowMethodsMiddleware} from "@/packages/middlewares/allow-methods.middleware";
import {getMongoClient} from "@/packages/database/client";
import {ObjectId} from "bson";
import {FacetType, Operator} from "@/packages/sdk/mongodb/search-meta/search-meta.types";
import {Search} from "@/packages/sdk/sdk";
import {BucketIdResolver, StringFacetUI, FacetResultUI, NumberFacetUI} from "@/packages/sdk/ui/sdk-ui-facets";
import {
    TextOperator,
    CompoundOperator,
    SearchStage,
    NearOperator,
    PhraseOperator,
    SearchOperator
} from "@/packages/sdk/mongodb/search/search.types";
import {BaseSearchPipeline} from "@/packages/sdk/mongodb/search/search";
import {SearchUI} from "@/packages/sdk/ui/sdk-ui";
import {Filter, FilterType, filterTypeKeys} from "@/packages/filters/filters.type";
import {mapToSearchOperator, PublishedAtFilter} from "@/packages/filters/published-at.filter";

// Set up Mongodb
const client = getMongoClient();
const episodes = client.db('online').collection('episodes');
const podcasts = client.db('online').collection('podcasts');

// Set up search
const search = new Search(episodes);
const searchUI = new SearchUI(search);

// Define Facets
const podcastIdFacet: StringFacetUI = {
    type: FacetType.STRING,
    name: "podcast_id_str",
    path: 'podcast_id_str',
    numBuckets: 10
};

const durationCategoryFacet: NumberFacetUI = {
    type: FacetType.NUMBER,
    name: "duration_in_sec",
    path: 'duration_in_sec',
    boundaries: [0, 30 * 60, 60 * 60, 10000 * 60],
    default: "more"
};

const podcastsResolver: BucketIdResolver<any> = async (facetResult, facetDefinitionUI) => {
    if (facetDefinitionUI.name === podcastIdFacet.name) {
        // Fetch podcasts
        const podcastObjectIds = facetResult.buckets.map((bucket) => new ObjectId(bucket._id));
        const podcastDocList = await podcasts.find({
            _id: {
                "$in": podcastObjectIds
            }
        }).toArray();

        // map MongoDB doc to bucket doc
        const bucketDocs = podcastDocList.map((podcastDoc) => {
            const {_id, ...rest} = podcastDoc;
            return {
                _id: `${_id}`,
                ...rest
            }
        });

        return bucketDocs;
    } else {
        return [];
    }
}

// Configure Search pipeline
const extractExactMatch = (searchQuery: string): string | undefined => {
    const split = searchQuery.split('"');

    if (split.length >= 3) {
        const exactMatchQuery = split[1].trim();
        if (exactMatchQuery.length) {
            return exactMatchQuery;
        }
    }
}

const searchPipelineBuilder = (searchQuery: string, filters: Filter[]) => {
    // Configure "must" operators
    const must = [];

    const exactMatchQuery = extractExactMatch(searchQuery);
    if (exactMatchQuery) {
        const phraseOperator = new PhraseOperator(
            exactMatchQuery,
            'title',
            'title_standard'
        );
        must.push(phraseOperator);
    } else {
        const title = new TextOperator(searchQuery, 'title', 3);
        const derivedSummary = new TextOperator(searchQuery, 'derived_summary', 2);
        const derivedTranscriptionText = new TextOperator(searchQuery, 'derived_transcription_text');
        must.push(...[
            title,
            derivedSummary,
            derivedTranscriptionText
        ]);
    }

    // Configure "should" operators
    const oneMonthInMilliseconds = 2592000000;
    const nearOperator = new NearOperator('published_at', new Date(), oneMonthInMilliseconds * 12, 4);

    // Configure filter operators
    const filterSearchOperators = mapFilterToSearchOperator(filters);

    const compound = new CompoundOperator({
        must,
        should: [
            nearOperator
        ],
        filter: filterSearchOperators,
    });

    const searchStage: SearchStage = {
        index: 'default',
        operator: compound
    };

    const baseSearchPipeline = new BaseSearchPipeline(searchStage, 40, [
        'title',
        'published_at',
        'derived_summary',
        'derived_transcription_text'
    ]);
    return baseSearchPipeline;
}

const mapFilterToSearchOperator = (filters: Filter[]): SearchOperator[] => {
    const searchOperators = filters.filter((filter) => {
        return filterTypeKeys.includes(filter.type);
    }).map((filter) => {
        switch (filter.type) {
            case FilterType.PUBLISHED_AT:
                return mapToSearchOperator(filter as PublishedAtFilter);
            default:
                // should not happen in theory as we filter out unknown filters before
                throw new Error(`Unsupported filter type: "${filter.type}"`);
        }
    });

    return searchOperators;
}

export interface EpisodeSearchResponse {
    facetResults: FacetResultUI[];
    searchResults: EpisodeSearchResult[];
}

const handler = async (req: NextApiRequest, res: NextApiResponse<EpisodeSearchResponse>) => {
    const searchQuery = req.query['searchQuery'] as string;
    const rawFilters = req.query['filters'] as string;

    if (!searchQuery) {
        res.status(HTTP_STATUS_CODE.OK);
        res.json({
            searchResults: [],
            facetResults: []
        });
        return;
    }

    let filters: Filter[];
    try {
        filters = JSON.parse(rawFilters);
    } catch (e) {
        filters = [];
        console.error(`Cannot parse filters.`);
    }

    // Fetch search and facets
    const searchPipeline = searchPipelineBuilder(searchQuery, filters);
    const facetOperator: Operator = searchPipeline.getSearchStage();
    const [mongodbEpisodesResults, facetResults] = await Promise.all([
        search.search(searchPipeline),
        searchUI.facets(facetOperator, [podcastIdFacet, durationCategoryFacet], {
            bucketIdResolver: podcastsResolver
        })
    ]);

    // Map results to public views
    const searchResults = mongodbEpisodesResults.map((mongodbEpisode) => {
        const episode: EpisodeSearchResult = {
            _id: mongodbEpisode._id,
            title: mongodbEpisode['title'],
            published_at: mongodbEpisode['published_at'],
            derived_summary: mongodbEpisode['derived_summary']
        };

        return episode;
    });
    const {facets} = facetResults;

    res.status(HTTP_STATUS_CODE.OK);
    res.json({
        searchResults: searchResults,
        facetResults: facets,
    });
};

export default use(captureErrorsMiddleware, allowMethodsMiddleware([HTTP_METHOD.GET]), handler);
