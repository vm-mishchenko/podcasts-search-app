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
import {
    BucketIdResolver,
    StringFacetUI,
    FacetResultUI,
    NumberFacetUI,
    SelectedFacet, FacetDefinitionUI
} from "@/packages/sdk/ui/sdk-ui-facets";
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
import {mapStringFacetToSearchOperator} from "@/packages/sdk/ui/string.facet";
import {Document} from "mongodb";
import {mapNumberFacetToSearchOperator} from "@/packages/sdk/ui/number.facet";
import {BaseStage} from "@/packages/sdk/mongodb/search/base-stage.types";
import {QueryStringOperator} from "@/packages/sdk/mongodb/search/queryString.operator";

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
    displayName: "Podcast",
    path: 'podcast_id_str',
    numBuckets: 10
};

const durationCategoryFacet: NumberFacetUI = {
    type: FacetType.NUMBER,
    name: "duration_in_sec",
    displayName: "Duration",
    path: 'duration_in_sec',
    boundaries: [0, /*30 mins*/ 25 * 60, /*60 mins*/ 60 * 60, /*more than 60 mins*/10000 * 60],
};

const facetDefinitions: FacetDefinitionUI[] = [durationCategoryFacet, podcastIdFacet];

const bucketIdResolver: BucketIdResolver<any> = async (facetResult, facetDefinitionUI) => {
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
    } else if (facetDefinitionUI.name === durationCategoryFacet.name) {
        return [
            {
                _id: 0,
                name: '0-25 min'
            },
            {
                _id: 25 * 60,
                name: '25-60 min'
            },
            {
                _id: 60 * 60,
                name: 'longer 60 min'
            }
        ];
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

const buildSearchQueryOperator = (searchQuery: string): SearchOperator => {
    if (!searchQuery.length) {
        return new QueryStringOperator("does-not-exists", "*:*");
    }

    const title = new TextOperator(searchQuery, 'title', 3);
    const derivedSummary = new TextOperator(searchQuery, 'derived_summary', 2);
    const derivedTranscriptionText = new TextOperator(searchQuery, 'derived_transcription_text');
    const queryCompound = new CompoundOperator({
        should: [
            title,
            derivedSummary,
            derivedTranscriptionText,
        ],
        minimumShouldMatch: 1
    });
    return queryCompound;
}

const buildSearchPipeline = (searchQuery: string, filters: Filter[], selectedFacets: SelectedFacet[], facetDefinitions: FacetDefinitionUI[]): BaseSearchPipeline => {
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
    }

    // Configure "should" operators
    const oneMonthInMilliseconds = 2592000000;
    const nearOperator = new NearOperator('published_at', new Date(), oneMonthInMilliseconds * 12, 4);

    // Configure filter operators
    const filterSearchOperators = mapFilterToSearchOperator(filters);
    const facetSearchOperators = mapFacetsToSearchOperator(selectedFacets, facetDefinitions);
    const facetNumberRangeOperators = mapFacetsToNumberRangeOperators(selectedFacets, facetDefinitions);

    const queryCompound = buildSearchQueryOperator(searchQuery);

    const boostCompound = new CompoundOperator({
        should: [
            nearOperator
        ],
        minimumShouldMatch: 1
    });

    let numberRangeCompound: CompoundOperator | undefined;
    if (facetNumberRangeOperators.length) {
        numberRangeCompound = new CompoundOperator({
            minimumShouldMatch: 1,
            should: facetNumberRangeOperators
        });
    }

    const rootShould = [
        queryCompound,
        boostCompound
    ];
    if (numberRangeCompound) {
        rootShould.push(numberRangeCompound);
    }
    const rootCompound = new CompoundOperator({
        must,
        should: rootShould,
        filter: [
            ...filterSearchOperators,
            ...facetSearchOperators
        ],
        minimumShouldMatch: rootShould.length
    });

    const searchStage: SearchStage = {
        index: 'default',
        operator: rootCompound
    };

    // other stage
    const matchStage = new BaseStage({$match: {}});
    const projectStage = new BaseStage({
        $project: {
            'title': 1,
            'published_at': 1,
            'derived_summary': 1,
            'duration_in_sec': 1,
            'derived_transcription_text': 1
        }
    });
    const limitStage = new BaseStage({$limit: 30})

    const baseSearchPipeline = new BaseSearchPipeline(searchStage, limitStage, matchStage, projectStage);
    return baseSearchPipeline;
}

const buildFacetPipeline = (facetDefinition: FacetDefinitionUI, searchQuery: string, filters: Filter[], selectedFacets: SelectedFacet[], facetDefinitions: FacetDefinitionUI[]): BaseSearchPipeline => {
    const otherSelectedFacets = selectedFacets.filter((selectedFacet) => {
        return selectedFacet.name !== facetDefinition.name;
    });
    const pipeline = buildSearchPipeline(searchQuery, filters, otherSelectedFacets, facetDefinitions);
    return pipeline;
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

/**
 * Transform selected facets to the MongoDB search operators to apply during $search request.
 */
const mapFacetsToSearchOperator = (selectedFacets: SelectedFacet[], facetDefinitions: FacetDefinitionUI[]): SearchOperator[] => {
    const supportedFacetTypes = [FacetType.STRING];
    const filterInvalidSelectedFacets = (selectedFacet: SelectedFacet): boolean => {
        if (selectedFacet.bucketIds.length === 0) {
            return false;
        }

        const facetDefinition = facetDefinitions.find((facetDefinition) => {
            return facetDefinition.name === selectedFacet.name;
        });

        return !!facetDefinition;
    };
    const filterUnsupportedFacets = (selectedFacet: SelectedFacet): boolean => {
        const facetDefinition = facetDefinitions.find((facetDefinition) => {
            return facetDefinition.name === selectedFacet.name;
        })!;

        return supportedFacetTypes.includes(facetDefinition.type);
    }

    const searchOperators = selectedFacets
        .filter(filterInvalidSelectedFacets)
        .filter(filterUnsupportedFacets)
        .map((selectedFacet) => {
            const facetDefinition = facetDefinitions.find((facetDefinition) => {
                return facetDefinition.name === selectedFacet.name;
            })!;
            switch (facetDefinition.type) {
                case FacetType.STRING:
                    return mapStringFacetToSearchOperator(facetDefinition, selectedFacet);
                default:
                    throw new Error("Unsupported facet.");
            }
        }).flatMap((searchOperators) => {
            return Array.isArray(searchOperators) ? searchOperators : [searchOperators];
        });
    return searchOperators;
}

const mapFacetsToNumberRangeOperators = (selectedFacets: SelectedFacet[], facetDefinitions: FacetDefinitionUI[]): SearchOperator[] => {
    const supportedFacetTypes = [FacetType.NUMBER];
    const filterInvalidSelectedFacets = (selectedFacet: SelectedFacet): boolean => {
        if (selectedFacet.bucketIds.length === 0) {
            return false;
        }

        const facetDefinition = facetDefinitions.find((facetDefinition) => {
            return facetDefinition.name === selectedFacet.name;
        });

        return !!facetDefinition;
    };
    const filterUnsupportedFacets = (selectedFacet: SelectedFacet): boolean => {
        const facetDefinition = facetDefinitions.find((facetDefinition) => {
            return facetDefinition.name === selectedFacet.name;
        })!;

        return supportedFacetTypes.includes(facetDefinition.type);
    }

    const searchOperators = selectedFacets
        .filter(filterInvalidSelectedFacets)
        .filter(filterUnsupportedFacets)
        .map((selectedFacet) => {
            const facetDefinition = facetDefinitions.find((facetDefinition) => {
                return facetDefinition.name === selectedFacet.name;
            })!;
            switch (facetDefinition.type) {
                case FacetType.NUMBER:
                    return mapNumberFacetToSearchOperator(facetDefinition, selectedFacet);
                default:
                    throw new Error("Unsupported facet.");
            }
        }).flatMap((searchOperators) => {
            return Array.isArray(searchOperators) ? searchOperators : [searchOperators];
        });
    return searchOperators;
}

export interface EpisodeSearchResponse {
    facetResults: FacetResultUI[];
    searchResults: EpisodeSearchResult[];
    searchPipeline: Document[];
}

const handler = async (req: NextApiRequest, res: NextApiResponse<EpisodeSearchResponse>) => {
    const searchQuery = req.query['searchQuery'] as string;
    const rawFilters = req.query['filters'] as string;
    const rawFacets = req.query['facets'] as string;

    // if (!searchQuery) {
    //     res.status(HTTP_STATUS_CODE.OK);
    //     res.json({
    //         searchResults: [],
    //         facetResults: [],
    //         searchPipeline: []
    //     });
    //     return;
    // }

    let filters: Filter[];
    try {
        filters = JSON.parse(rawFilters);
    } catch (e) {
        filters = [];
        console.error(`Cannot parse filters.`);
    }

    let selectedFacets: SelectedFacet[];
    try {
        selectedFacets = JSON.parse(rawFacets);
    } catch (e) {
        selectedFacets = [];
        console.error(`Cannot parse facets.`);
    }

    // Fetch search
    const searchPipeline = buildSearchPipeline(searchQuery, filters, selectedFacets, facetDefinitions);
    const searchPromise = search.search(searchPipeline);

    // Fetch facets
    const facetPromises = facetDefinitions.map((facetDefinition) => {
        const pipeline = buildFacetPipeline(facetDefinition, searchQuery, filters, selectedFacets, facetDefinitions)
        const searchStage: Document = pipeline.getSearchStage();
        const facetPromise = searchUI.facets(searchStage, [facetDefinition], {
            bucketIdResolver: bucketIdResolver
        });
        return facetPromise;
    });

    // Get Search and Facets results
    const [mongodbEpisodesResults, facetResultsList] = await Promise.all([
        searchPromise,
        Promise.all(facetPromises)
    ]);

    // Map results to public views
    const searchResults = mongodbEpisodesResults.map((mongodbEpisode) => {
        const episode: EpisodeSearchResult = {
            _id: mongodbEpisode._id,
            title: mongodbEpisode['title'],
            published_at: mongodbEpisode['published_at'],
            duration_in_sec: mongodbEpisode['duration_in_sec'],
            derived_summary: mongodbEpisode['derived_summary']
        };

        return episode;
    });
    const facets = facetResultsList.map((facetResults) => {
        return facetResults.facets[0];
    });

    res.status(HTTP_STATUS_CODE.OK);
    res.json({
        searchResults: searchResults,
        facetResults: facets,
        searchPipeline: searchPipeline.getPipeline()
    });
};

export default use(captureErrorsMiddleware, allowMethodsMiddleware([HTTP_METHOD.GET]), handler);
