import datetime

from pymongo import MongoClient

from config import MONGODB_CLUSTER, MONGODB_USER, MONGODB_PASSWORD

# Configure Mongodb connection
user = MONGODB_USER
password = MONGODB_PASSWORD
cluster = MONGODB_CLUSTER
uri = f"mongodb+srv://{user}:{password}@{cluster}/?retryWrites=true&w=majority"
mongo_client = MongoClient(uri)
db = mongo_client['online']
episodes = db['episodes']

# Send search request
pipeline = [
    {
        "$search": {
            "compound": {
                "should": [
                    {
                        "text": {
                            "query": "about",
                            "path": "title"
                        }
                    }
                ]
            }
        }
    },
    {
        "$limit": 5
    },
    {
        "$project": {
            "_id": -1,
            "title": 1,
            "published_at": 1,
            "score": {
                "$meta": "searchScore"
            }
        }
    }
]

results = list(episodes.aggregate(pipeline))
explain_result = db.command('aggregate', 'episodes', pipeline=pipeline, explain=True)


def print_results(results):
    for doc in results:
        print(f"{doc['published_at']} {doc['title']} | {doc['score']}")


print_results(results)
print(explain_result)
