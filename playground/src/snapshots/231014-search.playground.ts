import {MongoClient} from "mongodb";
import {config} from "../config";
import {Search} from "../sdk/sdk";
import {TextOperator, SearchOperatorType, SearchStage, CompoundOperator} from "../sdk/mongodb/search/search.types";
import {BaseSearchPipeline, SimpleSearchPipeline} from "../sdk/mongodb/search/search";

// Configure MongoDB
const client = new MongoClient(`mongodb+srv://${config.MONGODB_USER}:${config.MONGODB_PASSWORD}@${config.MONGODB_CLUSTER}/?retryWrites=true&w=majority`);
const episodes = client.db('online').collection('episodes');
const search = new Search(episodes);

// Configure Search request
const titleOperator = new TextOperator('llm', 'title', 3);
const derivedSummary = new TextOperator('llm', 'derived_summary', 3);

const compound = new CompoundOperator({
    should: [
        titleOperator,
        derivedSummary
    ]
});

const searchStage: SearchStage = {
    index: 'default',
    operator: compound
};

const baseSearchPipeline = new BaseSearchPipeline(searchStage);

const simpleSearchPipeline = new SimpleSearchPipeline('default', 'llm', ['title']);

search.search(simpleSearchPipeline)
    .then((response) => {
        console.log(response)
    }).catch((error) => {
    console.error(error)
}).finally(process.exit);
