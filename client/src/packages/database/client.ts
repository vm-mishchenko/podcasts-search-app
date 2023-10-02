import {MongoClient} from 'mongodb';
import {config} from "@/config";

const MONGODB_CONNECTION = `mongodb+srv://${config.MONGODB_USER}:${config.MONGODB_PASSWORD}@${config.MONGODB_CLUSTER}/?retryWrites=true&w=majority`;

let mongoClient: MongoClient;
export const getMongoClient = async (): Promise<MongoClient> => {
    if (!mongoClient) {
        console.log('Successfully connected to MongoDB.');
        mongoClient = await MongoClient.connect(MONGODB_CONNECTION);
    }

    return mongoClient;
};
