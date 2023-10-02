import datetime

from pymongo import MongoClient

from whisper_backup import get_whisper_artifacts

old_artifacts = get_whisper_artifacts()

new_artifacts = []
for old_artifact in old_artifacts:
    if old_artifact['status'] != 'completed':
        continue

    new_artifact = {
        'audioUrl': old_artifact['audioUrl'],
        'transcription': old_artifact['transcription'],
        'status': 'SUCCESS',
        'createdAt': datetime.datetime.now().isoformat(),
        'startProcessingAt': datetime.datetime.now().isoformat(),
        'finishedAt': datetime.datetime.now().isoformat()
    }

    new_artifacts.append(new_artifact)

# Save artifact
user = "xxx"
password = "xxx"
cluster = "xxx"
database = "xxx"
collection = "xxx"
uri = f"mongodb+srv://{user}:{password}@{cluster}/?retryWrites=true&w=majority"
mongo_client = MongoClient(uri)

print(f"Insert {len(new_artifacts)} artifacts")
mongo_client[database][collection].insert_many(new_artifacts)

print("Success.")
