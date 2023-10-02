import json
import os
import pathlib
from typing import List


def get_whisper_artifacts() -> List[any]:
    current_directory = pathlib.Path(__file__).parent.resolve()
    local_file_path = os.path.join(current_directory, '230929-whisper-backup.json')
    with open(local_file_path, 'r') as f:
        episodes = json.load(f)
        return episodes
