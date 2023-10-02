import json
import os
import pathlib
from typing import List


def get_podcast() -> any:
    current_directory = pathlib.Path(__file__).parent.resolve()
    local_file_path = os.path.join(current_directory, 'recommender_systems_experts_podcast.json')
    with open(local_file_path, 'r') as f:
        podcast = json.load(f)
        return podcast


def get_episodes() -> List[any]:
    current_directory = pathlib.Path(__file__).parent.resolve()
    local_file_path = os.path.join(current_directory, '231005_recommender_systems_experts.json')
    with open(local_file_path, 'r') as f:
        episodes = json.load(f)
        return episodes
