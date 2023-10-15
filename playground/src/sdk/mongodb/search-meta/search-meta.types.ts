/**
 * Types mimics the real response from the $searchMeta definition and result.
 */

export enum FacetType {
    STRING = "string",
    NUMBER = "number",
}

export interface NumberFacet {
    type: FacetType.NUMBER;
    path: string,
    boundaries: number[];
    default: string;
}

export interface StringFacet {
    type: FacetType.STRING;
    path: string,
    numBuckets: number;
}

// https://www.mongodb.com/docs/atlas/atlas-search/facet/#facet-definition
export type FacetDefinition = NumberFacet | StringFacet;

export type FacetName = string;

// todo-vm: maybe transform it to the Map?
export interface Facets extends Record<FacetName, FacetDefinition> {
}

export interface Operator extends Record<string, any> {
}

export interface Facet {
    operator: Operator;
    facets: Facets;
}

export interface SearchMetaStage {
    facet: Facet
}

export interface SearchMetaPipeline {
    $searchMeta: SearchMetaStage
}


// Facet Results
// https://www.mongodb.com/docs/atlas/atlas-search/facet/#facet-results
export type BucketId = string;

export interface Bucket {
    _id: BucketId;
    count: number;
}

export interface FacetResult {
    buckets: Bucket[]
}

export interface FacetsResults extends Record<string, FacetResult> {
}

export interface SearchMetaStageResult {
    count: {
        loweBound: number;
    };
    facet: FacetsResults
}
