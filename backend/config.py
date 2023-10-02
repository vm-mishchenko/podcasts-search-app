import os
from os.path import join, dirname

from dotenv import load_dotenv

dotenv_path = join(dirname(__file__), '.env')
load_dotenv(dotenv_path=dotenv_path, override=True)

# Mongodb connection
MONGODB_CLUSTER = os.environ['MONGODB_CLUSTER']
MONGODB_USER = os.environ['MONGODB_USER']
MONGODB_PASSWORD = os.environ['MONGODB_PASSWORD']

# Openai key to summarize transcription
OPEN_AI_API_KEY = os.environ['OPEN_AI_API_KEY']

# Whisper access token to schedule audio for transcription
# https://github.com/vm-mishchenko/whisper-service
WHISPER_ADMIN_ACCESS_TOKEN = os.environ['WHISPER_ADMIN_ACCESS_TOKEN']
