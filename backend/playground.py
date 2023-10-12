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
        # https://www.mongodb.com/docs/atlas/atlas-search/query-syntax/#-searchmeta
        "$searchMeta": {
            "facet": {
                "operator": {
                    "compound": {
                        "should": [
                            {
                                "text": {
                                    "query": "year",
                                    "path": "title"
                                }
                            }
                        ]
                    }
                },
                "facets": {
                    "podcastIdsFacet": {
                        "type": "string",
                        "path": "podcast_id_str"
                    }
                }
            }
        }
    }
]

results = list(episodes.aggregate(pipeline))

print(results)
