import {Search, FacetPipeline} from "./sdk";
import {
    FacetName,
    BucketId,
    FacetResult,
    NumberFacet,
    StringFacet,
    Operator,
    Facets,
    FacetsResults,
    FacetDefinition
} from "./pipeline";

export class SearchUI {
    private readonly search: Search;

    constructor(search: Search) {
        this.search = search;
    }

    static getFacetPipeline(operator: Operator, facetDefinitionUIList: FacetDefinitionUI[]) {
        const facets = SearchUI.getFacets(facetDefinitionUIList);
        return new FacetPipeline(operator, facets);
    }

    static getFacets(facetDefinitionUIList: FacetDefinitionUI[]) {
        const facets: Facets = {};
        facetDefinitionUIList.forEach((facetDefinitionUI) => {
            const {name, ...facetDefinition} = facetDefinitionUI;
            if (name in facets) {
                throw new Error(`All facet definition must have unique name, found duplicate: ${facetDefinitionUI.name}`);
            }

            facets[name] = facetDefinition;
        });

        return facets;
    }

    async facets(operator: Operator, facetDefinitionUIList: FacetDefinitionUI[], options: SearchFacetOptions = {}): Promise<SearchFacetUIResult> {
        // Fetch facets
        const facetPipeline = SearchUI.getFacetPipeline(operator, facetDefinitionUIList);
        const searchMetaStageResult = await this.search.facets(facetPipeline);

        // Map MongoDB facets to UI facets
        const facetNames: FacetName[] = Object.keys(searchMetaStageResult.facet);

        const facets: FacetResultUI[] = [];
        for (const facetName of facetNames) {
            // get MongoDB facet result
            const facetResult = searchMetaStageResult.facet[facetName];

            // get facet definition UI
            const facetDefinition = facetDefinitionUIList.find((facetDefinitionUI) => facetDefinitionUI.name === facetName);
            if (!facetDefinition) {
                throw new Error(`Mongot did not returned requested facet with name: ${facetName}.`);
            }

            // get selected bucket ids
            const selectedFacet = options.selectedFacets ? options.selectedFacets.find((selectedFacet) => selectedFacet.name === facetName) : undefined;
            const selectedBuketIds = selectedFacet ? selectedFacet.bucketIds : [];

            // resolve bucket ids to custom documents
            const resolver = options.bucketIdResolver || defaultBucketIdResolver;
            const bucketDocs = await resolver(facetResult, facetDefinition);

            // build FacetUI
            const facetUI: FacetResultUI = {
                facetResult,
                facetDefinition,
                selectedBuketIds,
                bucketDocs
            }

            facets.push(facetUI);
        }

        return {facets};
    }
}

export interface SearchFacetOptions {
    selectedFacets?: SelectedFacet[];
    bucketIdResolver?: BucketIdResolver<any>
}

const defaultBucketIdResolver: BucketIdResolver<any> = async (facetResult: FacetResult) => {
    const bucketDocs = facetResult.buckets.map((bucket) => {
        return {
            _id: bucket._id
        };
    });
    return bucketDocs;
}

export interface SearchFacetUIResult {
    facets: FacetResultUI[]
}

// Client sends SelectedFacet back to server for search request.
export interface SelectedFacet {
    name: FacetName,
    bucketIds: BucketId[]
}

// UI specific Facet definitions (better UX relative to MongoDB Facet types; no functional changes).
export type FacetDefinitionUI = NumberFacetUI | StringFacetUI;

// Number facet definition to build request to MongoDB.
// todo-vm: don't extend - use composition instead
export interface NumberFacetUI extends NumberFacet {
    name: FacetName;
}

// String facet definition to build request to MongoDB.
export interface StringFacetUI extends StringFacet {
    name: FacetName; // Uniquely identifies facet to distinguish between different facets on the same field.
}

// Server sends FacetResultUI back as response for search request.
export interface FacetResultUI {
    facetResult: FacetResult;
    facetDefinition: FacetDefinitionUI;
    selectedBuketIds: BucketId[]
    bucketDocs: Array<BucketDoc>
}

export interface BucketDoc extends Record<BucketId, any> {
}

export type BucketIdResolver<D extends BucketDoc> = (facetResult: FacetResult, facetDefinitionUI: FacetDefinitionUI) => Promise<D[]>;
