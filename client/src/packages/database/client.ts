import {MongoClient} from 'mongodb';
import {config} from "@/config";

const MONGODB_CONNECTION = `mongodb+srv://${config.MONGODB_USER}:${config.MONGODB_PASSWORD}@${config.MONGODB_CLUSTER}/?retryWrites=true&w=majority`;

let mongoClient: MongoClient;
export const getMongoClient = (): MongoClient => {
    if (!mongoClient) {
        console.log('Successfully connected to MongoDB.');
        mongoClient = new MongoClient(MONGODB_CONNECTION);
    }

    return mongoClient;
};
