import {FacetName, BucketId, FacetResult, NumberFacet, StringFacet} from "../mongodb/search-meta/search-meta.types";

export interface SearchFacetOptions {
    selectedFacets?: SelectedFacet[];
    bucketIdResolver?: BucketIdResolver<any>
}

export const defaultBucketIdResolver: BucketIdResolver<any> = async (facetResult: FacetResult) => {
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
