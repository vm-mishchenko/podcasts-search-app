import {SearchOperator, SearchOperatorType} from "@/packages/sdk/mongodb/search/search.types";

export interface RangeValues {
    gt?: Date | number;
    gte?: Date | number;
    lt?: Date | number;
    lte?: Date | number;
}

export interface RangeOperatorDefinition extends RangeValues {
    path: string;
}

export class RangeOperator implements SearchOperator {
    type = SearchOperatorType.RANGE;
    path: string;
    range: RangeValues;

    constructor(path: string, range: RangeValues) {
        this.path = path;
        this.range = range;
    }

    toDefinition(): RangeOperatorDefinition {
        const definition: RangeOperatorDefinition = {
            path: this.path,
        }

        if (this.range.gt !== undefined) {
            definition.gt = this.range.gt;
        }
        if (this.range.gte !== undefined) {
            definition.gte = this.range.gte;
        }
        if (this.range.lt !== undefined) {
            definition.lt = this.range.lt;
        }
        if (this.range.lte !== undefined) {
            definition.lte = this.range.lte;
        }

        return definition;
    }
}
