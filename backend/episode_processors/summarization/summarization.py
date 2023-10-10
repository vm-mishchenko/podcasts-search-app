import json
import os
import pathlib
from time import sleep
from typing import Dict
import openai
from backend.config import OPEN_AI_API_KEY, EPISODE_PROCESSOR_SKIP_CALL_OPEN_AI

openai.api_key = OPEN_AI_API_KEY


def summarize(text: str, episode_id: str):
    cache_key = episode_id
    cache = load_cache()

    if cache_key not in cache:
        if EPISODE_PROCESSOR_SKIP_CALL_OPEN_AI:
            print("Miss summarization cache. Return empty string.")
            return ""
        else:
            print("Miss summarization cache. Call openai to get summary.")
            cache[cache_key] = _summarize_text(text)
            save_cache(cache)
            sleep(30)  # need to wait; openai imposes requests limit per minute

    return cache[cache_key]


def _summarize_text(text: str) -> str:
    # price: https://openai.com/pricing
    # balance: https://platform.openai.com/account/billing/overview
    # api: https://platform.openai.com/docs/guides/gpt/completions-api
    # playground: https://platform.openai.com/playground
    # examples: https://platform.openai.com/examples

    # 740470 is approximately max string length "gpt-3.5-turbo-16k" model can summarize
    current_token_size = 73000
    min_token_size = 50000
    reduce_tokens_num = 1000

    # Gradually reduce text size till enough to get summary
    while current_token_size > min_token_size:
        text_cut = text[0:current_token_size]
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo-16k",
                messages=[
                    {"role": "system",
                     "content": "You are a highly skilled AI trained in language comprehension and summarization. Read the following text and summarize it into a concise abstract paragraph. Aim to retain the most important points, providing a coherent and readable summary that could help a person understand the main points of the discussion without needing to read the entire text. Please avoid unnecessary details or tangential points."
                     },
                    {"role": "user", "content": text_cut}
                ]
            )

            print("Success. Got the summary from openai.")
            return response['choices'][0]['message']['content']
        except Exception:
            current_token_size = current_token_size - reduce_tokens_num
            print(f"Reduce token size to {current_token_size}")

    raise Exception("Cannot get summary from openai.")


def load_cache() -> Dict:
    current_directory = pathlib.Path(__file__).parent.resolve()
    local_file_path = os.path.join(current_directory, 'cache.json')
    with open(local_file_path, 'r') as f:
        cache = json.load(f)
        return cache


def save_cache(cache):
    current_directory = pathlib.Path(__file__).parent.resolve()
    local_file_path = os.path.join(current_directory, 'cache.json')
    with open(local_file_path, 'w') as json_file:
        json.dump(cache, json_file, indent=4)
