import {SearchStage, TextOperator, CompoundOperator, SearchPipeline} from "./search.types";
import {Document} from "mongodb";
import {BaseStage} from "@/packages/sdk/mongodb/search/base-stage.types";

/**
 * One of the template for a pipeline. I could create more if necessary.
 */
export class BaseSearchPipeline implements SearchPipeline {
    stage: SearchStage;

    constructor(stage: SearchStage, public limitStage: BaseStage, public matchStage: BaseStage, public projectStage: BaseStage) {
        this.stage = stage;
    }

    getPipeline(): Document[] {
        const searchStage = {
            $search: this.getSearchStage()
        };

        return [
            searchStage,
            this.matchStage.toDefinition(),
            this.limitStage.toDefinition(),
            this.projectStage.toDefinition()
        ];
    }

    getSearchStage(): Document {
        // Search stage
        const {type} = this.stage.operator;
        return {
            index: this.stage.index,
            [type]: this.stage.operator.toDefinition()
        };
    }
}

export class SimpleSearchPipeline implements SearchPipeline {
    index: string;
    query: string;
    fields: string[];

    constructor(index: string, query: string, fields: string[]) {
        this.index = index;
        this.query = query;
        this.fields = fields;
    }

    getPipeline(): Document[] {
        // Search stage
        const searchStage = {
            $search: this.getSearchStage()
        };

        // Limit stage
        const limitStage = {
            $limit: 10
        };

        return [
            searchStage,
            limitStage,
        ];
    }

    getSearchStage(): Document {
        const textOperators = this.fields.map((field) => {
            const textOperator = new TextOperator(this.query, field);
            return textOperator;
        })

        const compound = new CompoundOperator({
            should: [...textOperators]
        });

        // Search stage
        const searchStage = {
            index: this.index,
            [compound.type]: compound.toDefinition()
        };

        return searchStage;
    }
}
