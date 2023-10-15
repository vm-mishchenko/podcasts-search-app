import {
    SearchOperator,
    Score,
    SearchOperatorDefinition,
    SearchOperatorType
} from "@/packages/sdk/mongodb/search/search.types";

export interface RangeOperatorDefinition {
    path: string;
    gte: Date
}

export class RangeOperator implements SearchOperator {
    type = SearchOperatorType.RANGE;
    path: string;
    gte: Date;

    constructor(path: string, gte: Date) {
        this.path = path;
        this.gte = gte;
    }

    toDefinition(): RangeOperatorDefinition {
        return {
            path: this.path,
            gte: this.gte,
        };
    }
}
