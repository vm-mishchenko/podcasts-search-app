import {SearchOperatorDefinition} from "@/packages/sdk/mongodb/search/search.types";
import {Document} from "mongodb";

export interface StageDefinition extends Document {
}

export class BaseStage {
    constructor(public stageDefinition: Document) {
    }

    toDefinition(): StageDefinition {
        return this.stageDefinition;
    }
}
