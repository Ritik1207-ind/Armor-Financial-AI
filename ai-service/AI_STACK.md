# AI Stack Alignment

This service now includes the problem-statement AI stack in the implementation:

- OpenAI Whisper support through `OPENAI_API_KEY`
- Indic-ASR / Hugging Face support through `HF_API_TOKEN` and `HF_INDIC_ASR_MODEL`
- `transformers` pipelines for zero-shot topic detection and summarization
- `spaCy` matcher-based financial entity extraction
- Hugging Face Inference API support via `huggingface-hub`

Environment variables:

- `OPENAI_API_KEY`
- `HF_API_TOKEN`
- `HF_TOPIC_MODEL`
- `HF_SUMMARY_MODEL`
- `HF_INDIC_ASR_MODEL`
- `STT_PROVIDER=auto|openai|huggingface|groq`
