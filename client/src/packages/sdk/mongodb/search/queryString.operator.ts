import {SearchOperator, SearchOperatorType} from "@/packages/sdk/mongodb/search/search.types";

export interface QueryStringOperatorDefinition {
    defaultPath: string;
    query: string;
}

export class QueryStringOperator implements SearchOperator {
    type = SearchOperatorType.QUERY_STRING;
    defaultPath: string;
    query: string;

    constructor(defaultPath: string, query: string) {
        this.defaultPath = defaultPath;
        this.query = query;
    }

    toDefinition(): QueryStringOperatorDefinition {
        return {
            defaultPath: this.defaultPath,
            query: this.query,
        };
    }
}
