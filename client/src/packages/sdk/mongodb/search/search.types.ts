// Search Pipeline

import {Document} from "mongodb";
import {RangeOperatorDefinition} from "@/packages/sdk/mongodb/search/range.operator";

export interface SearchPipeline {
    getPipeline(): Document[];

    getSearchStage(): Document;
}

export interface SearchStage {
    index: string;
    operator: SearchOperator
}


// Search Operators
export interface SearchOperator {
    type: SearchOperatorType;

    toDefinition(): SearchOperatorDefinition;
}

export type SearchOperatorDefinition =
    TextOperatorDefinition
    | NearOperatorDefinition
    | CompoundOperatorDefinition
    | PhraseOperatorDefinition
    | RangeOperatorDefinition;

export interface SearchOperatorDefinitionMap extends Record<string, SearchOperatorDefinition> {
}

/**
 * Type should match MongoDB Atlas search operator names.
 */
export enum SearchOperatorType {
    // https://www.mongodb.com/docs/atlas/atlas-search/text/
    TEXT = "text",
    // https://www.mongodb.com/docs/atlas/atlas-search/near/
    NEAR = "near",
    // https://www.mongodb.com/docs/atlas/atlas-search/compound/
    COMPOUND = "compound",
    // https://www.mongodb.com/docs/atlas/atlas-search/phrase
    PHRASE = "phrase",
    // https://www.mongodb.com/docs/atlas/atlas-search/range/
    RANGE = "range"
}

export interface TextOperatorDefinition {
    query: string;
    path: string;
    score?: Score;
}

export class TextOperator implements SearchOperator {
    type = SearchOperatorType.TEXT;
    query: string;
    path: string;
    boost?: number;

    constructor(query: string, path: string, boost?: number) {
        this.query = query;
        this.path = path;
        this.boost = boost;
    }

    toDefinition(): TextOperatorDefinition {
        const definition: TextOperatorDefinition = {
            query: this.query,
            path: this.path,
        }

        if (this.boost) {
            definition.score = {
                boost: {
                    value: this.boost
                }
            }
        }

        return definition;
    }
}

export interface Score {
    boost: {
        value: number
    }
}

export interface NearOperatorDefinition {
    path: string;
    origin: Date;
    pivot: number;
    score?: Score;
}

export class NearOperator implements SearchOperator {
    type = SearchOperatorType.NEAR;
    path: string;
    origin: Date;
    pivot: number;
    boost?: number;

    constructor(path: string, origin: Date, pivot: number, boost?: number) {
        this.path = path;
        this.origin = origin;
        this.pivot = pivot;
        this.boost = boost;
    }

    toDefinition(): NearOperatorDefinition {
        const definition: NearOperatorDefinition = {
            path: this.path,
            origin: this.origin,
            pivot: this.pivot
        };

        if (this.boost) {
            definition.score = {
                boost: {
                    value: this.boost
                }
            }
        }

        return definition;
    }
}

export interface PhraseOperatorDefinition {
    query: string;
    path: {
        value: string,
        multi: string;
    }
}

export class PhraseOperator implements SearchOperator {
    type = SearchOperatorType.PHRASE;
    query: string;
    path: string;
    multi: string;

    constructor(query: string, path: string, multi: string) {
        this.query = query;
        this.path = path;
        this.multi = multi;
    }

    toDefinition(): PhraseOperatorDefinition {
        const definition: PhraseOperatorDefinition = {
            query: this.query,
            path: {
                value: this.path,
                multi: this.multi
            }
        };

        return definition;
    }
}

export interface CompoundOperatorDefinition {
    must: SearchOperatorDefinitionMap[];
    mustNot: SearchOperatorDefinitionMap[];
    should: SearchOperatorDefinitionMap[];
    filter: SearchOperatorDefinitionMap[];
    minimumShouldMatch: number;
}

export interface CompoundOperatorProps {
    must?: SearchOperator[];
    mustNot?: SearchOperator[];
    should?: SearchOperator[];
    filter?: SearchOperator[];
    minimumShouldMatch?: number;
}

export class CompoundOperator implements SearchOperator {
    type = SearchOperatorType.COMPOUND
    props: CompoundOperatorProps

    constructor(props: CompoundOperatorProps) {
        this.props = props;
    }

    toDefinition(): CompoundOperatorDefinition {
        const should = this.props.should ? this.props.should.map((searchOperator) => {
            return {
                [searchOperator.type]: searchOperator.toDefinition()
            };
        }) : [];
        const must = this.props.must ? this.props.must.map((searchOperator) => {
            return {
                [searchOperator.type]: searchOperator.toDefinition()
            };
        }) : [];
        const mustNot = this.props.mustNot ? this.props.mustNot.map((searchOperator) => {
            return {
                [searchOperator.type]: searchOperator.toDefinition()
            };
        }) : [];
        const filter = this.props.filter ? this.props.filter.map((searchOperator) => {
            return {
                [searchOperator.type]: searchOperator.toDefinition()
            };
        }) : [];
        const minimumShouldMatch = this.props.minimumShouldMatch ? this.props.minimumShouldMatch : 0;
        return {
            should,
            must,
            mustNot,
            filter,
            minimumShouldMatch,
        }
    }
}


// Search Result
export interface SearchResult {
}
