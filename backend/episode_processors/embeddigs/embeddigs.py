# Distilled BERT: https://huggingface.co/docs/transformers/model_doc/distilbert
# Runs 60% faster while preserving over 95% of BERT’s performances
from transformers import DistilBertTokenizer, DistilBertModel

# https://huggingface.co/prajjwal1/bert-tiny
# Small pre-trained BERT model for better performance
model_name = 'prajjwal1/bert-tiny'
tokenizer = DistilBertTokenizer.from_pretrained(model_name)

# https://huggingface.co/docs/transformers/model_doc/distilbert#transformers.DistilBertModel
model = DistilBertModel.from_pretrained(model_name)
