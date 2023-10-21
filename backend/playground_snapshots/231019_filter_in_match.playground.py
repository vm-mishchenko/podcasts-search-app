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
                            "path": {"wildcard": "*"}
                        }
                    }
                ],
                "filter": [
                    {
                        "queryString": {
                            "defaultPath": "podcast_id_str",
                            "query": "652f2a5fc1cd93e7a3a14ae0 OR 652f3279c1cd93e7a3aa5b65"
                        }
                    }
                ]
            }
        }
    },
    {
        '$match': {
            "$or": [
                {
                    "duration_in_sec": {
                        "$gte": 0,
                        "$lt": 500,
                    },
                },
                {
                    "duration_in_sec": {
                        "$gte": 3000,
                        "$lt": 3050,
                    },
                },
            ],
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
