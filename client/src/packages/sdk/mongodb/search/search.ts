import {SearchStage, TextOperator, CompoundOperator, SearchPipeline} from "./search.types";
import {Document} from "mongodb";

/**
 * One of the template for a pipeline. I could create more if necessary.
 */
export class BaseSearchPipeline implements SearchPipeline {
    stage: SearchStage;
    limit: number;
    project: string[];

    constructor(stage: SearchStage, limit: number = 10, project: string[] = ['_id']) {
        this.stage = stage;
        this.limit = limit;
        this.project = project;
    }

    getPipeline(): Document[] {
        // Search stage
        const searchStage = {
            $search: this.getSearchStage()
        };

        // Limit stage
        const limitStage = {
            $limit: this.limit
        };

        // Project stage
        const projectFields = this.project.reduce((result, path) => {
            result[path] = 1;
            return result;
        }, {} as Record<string, number>);
        const projectStage = {
            $project: projectFields
        };

        return [
            searchStage,
            limitStage,
            projectStage
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
