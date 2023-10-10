# 1. get podcasts from the file
# 2. process them one by one
# 3. save into mongodb collection
import datetime
from time import sleep
from typing import List, Tuple

import requests
from pymongo import MongoClient
from bson.objectid import ObjectId

from config import MONGODB_CLUSTER, MONGODB_USER, MONGODB_PASSWORD, WHISPER_ADMIN_ACCESS_TOKEN
from episode_processors.summarization.summarization import summarize

from podcasts.you_are_not_so_smart.you_are_not_so_smart_source import get_episodes as you_are_not_so_smart_get_episodes, \
    get_podcast as you_are_not_so_smart_get_podcast
from podcasts.practicalai.practicalai_source import get_episodes as practicalai_get_episodes, \
    get_podcast as practicalai_get_podcast
from podcasts.changelog.changelog_source import get_episodes as changelog_get_episodes, \
    get_podcast as changelog_get_podcast
from podcasts.mongodb.mongodb_source import get_episodes as mongodb_get_episodes, get_podcast as mongodb_get_podcast
from podcasts.recommender_systems_experts.recommender_systems_experts_source import \
    get_episodes as recommender_systems_experts_get_episodes, get_podcast as recommender_systems_experts_get_podcast
from podcasts.software_engineering.software_engineering_source import get_episodes as software_engineering_get_episodes, \
    get_podcast as software_engineering_get_podcast

# List of podcasts to process
podcasts = [
    # Process Changelog
    (changelog_get_podcast, changelog_get_episodes),
    # Mongodb podcast
    (mongodb_get_podcast, mongodb_get_episodes),
    # Software engineering podcast
    (software_engineering_get_podcast, software_engineering_get_episodes),
    # Process Recommender systems experts
    (recommender_systems_experts_get_podcast, recommender_systems_experts_get_episodes),
    # Practical AI
    (practicalai_get_podcast, practicalai_get_episodes),
    # You are not so smart
    (you_are_not_so_smart_get_podcast, you_are_not_so_smart_get_episodes),
]

# Configure Mongodb connection
user = MONGODB_USER
password = MONGODB_PASSWORD
cluster = MONGODB_CLUSTER
uri = f"mongodb+srv://{user}:{password}@{cluster}/?retryWrites=true&w=majority"
mongo_client = MongoClient(uri)

# Configure Mongodb collections
database = 'online'
podcasts_collection = mongo_client[database]['podcasts']
episodes_collection = mongo_client[database]['episodes']
transcriptions_collection = mongo_client[database]['transcriptions']


def process_episode(episode: any, episode_id: str, podcast_id: str) -> Tuple[any, List[any]]:
    episode['podcast_id'] = podcast_id

    # Get transcription
    transcription = get_transcription(episode)
    for index, chunk in enumerate(transcription):
        chunk['index'] = index
        chunk['podcast_id'] = ObjectId(podcast_id)
        chunk['episode_id'] = ObjectId(episode_id)

    # Get episode transcription as text
    text = get_transcription_as_text(transcription)
    episode['derived_transcription_text'] = text

    # Get episode summary based on transcription
    summary = summarize(episode['derived_transcription_text'], episode['id'])
    episode['derived_summary'] = summary

    return episode, transcription


def fetch_transcription(episode_audio_url: str) -> List[any]:
    service_url = 'https://whisper-app-b4lxkp5rjq-uc.a.run.app/api/audio'
    data = {
        'url': episode_audio_url,
        'ADMIN_ACCESS_TOKEN': WHISPER_ADMIN_ACCESS_TOKEN
    }
    response = requests.post(service_url, data=data)
    return response.json()


def get_transcription(episode: any) -> List[any]:
    audio_url = episode['audio_url']

    start = datetime.datetime.now()
    max_time_to_wait_in_minutes = 120
    sleep_seconds = 20

    num_of_attempts = 0

    while True:
        now = datetime.datetime.now()
        duration = now - start
        duration_in_minutes = divmod(duration.total_seconds(), 60)[0]

        if duration_in_minutes > max_time_to_wait_in_minutes:
            # timeout! stop polling and waiting for transcription results
            raise Exception(f"Waited for {duration_in_minutes} but didn't get a transcription")
        elif num_of_attempts > 0:
            print(f"Waiting for transcription '{duration_in_minutes}' minutes.")

        result = fetch_transcription(audio_url)

        if num_of_attempts > 0:
            print(
                f"Transcription status is '{result['status']}' with '{len(result['transcription'])}' transcription chunks.")

        if result['status'] == 'SUCCESS':
            if len(result['transcription']) == 0:
                raise Exception("Transcription status is success, but there is no actual transcription")

            transcription = result['transcription']
            return transcription
        else:
            num_of_attempts += 1
            sleep(sleep_seconds)


def get_transcription_as_text(transcription: List[any]) -> str:
    text = ""
    for index, chunk in enumerate(transcription):
        if index == 0:
            text += chunk['text']
        else:
            text += " " + chunk['text']

    return text


# Clean up all previous data
print("Delete previous podcasts.")
podcasts_collection.delete_many({})
print("Delete previous episodes.")
episodes_collection.delete_many({})
print("Delete previous transcriptions.")
transcriptions_collection.delete_many({})

# Process episodes for each podcast (transcribe, generate summary, save in MongoDB, etc.)
for (get_podcast, get_episodes) in podcasts:
    # Process podcast
    podcast = get_podcast()
    print(f"Process '{podcast['name']}' podcast.")
    podcast_insert_result = podcasts_collection.insert_one(podcast)
    podcast['_id'] = str(podcast_insert_result.inserted_id)

    # Process episodes
    episodes = get_episodes()
    episodes.reverse()
    print(f"Process {len(episodes)} episodes.")
    for count, episode in enumerate(episodes):
        # Process episode
        print(f"Start processing {count} episode, name: {episode['title']}")

        # Insert new empty episode
        episode_insert_result = episodes_collection.insert_one({})
        episode_id = str(episode_insert_result.inserted_id)

        # Get processed episode
        result = process_episode(episode, episode_id, podcast['_id'])
        processed_episode = result[0]
        transcription = result[1]

        # Save episode
        episodes_collection.update_one({'_id': episode_insert_result.inserted_id}, {
            '$set': processed_episode
        })

        # Save transcription
        transcriptions_collection.insert_many(transcription)
