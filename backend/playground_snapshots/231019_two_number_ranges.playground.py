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
                "minimumShouldMatch": 2,
                "should": [
                    {
                        "text": {
                            "query": "about",
                            "path": {"wildcard": "*"}
                        }
                    },
                    {
                        "compound": {
                            "minimumShouldMatch": 1,
                            "should": [
                                {
                                    "range": {
                                        "path": "duration_in_sec",
                                        "gt": 0,
                                        "lte": 100
                                    }
                                },
                                {
                                    "range": {
                                        "path": "duration_in_sec",
                                        "gt": 300,
                                        "lte": 400
                                    }
                                }
                            ]
                        }
                    }
                ],
            }
        }
    },
    {
        "$limit": 50
    },
    {
        "$project": {
            "_id": -1,
            "duration_in_sec": 1,
            "podcast_id_str": 1,
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
        print(doc)


print(f"Results size: {len(results)} \n")
print_results(results)
