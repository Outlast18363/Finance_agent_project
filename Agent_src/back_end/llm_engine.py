# llm_engine.py
import os
from huggingface_hub import InferenceClient
from langchain.llms.base import LLM
from pydantic import PrivateAttr

class PromptEngine(LLM):
    """
    Wraps Hugging Face's Serverless Inference API via InferenceClient,
    with a fixed system prompt plus dynamic user queries.
    """

    # Declare truly-private attributes that Pydantic won't validate
    _system_msg: str = PrivateAttr()
    _client: InferenceClient = PrivateAttr()

    def __init__(self):
        # 1) Initialize the parent LLM (BaseModel) first
        super().__init__()

        # 2) Read model & token from env
        model_id = "meta-llama/Llama-3.2-1B-Instruct"
        hf_token = os.getenv("HF_TOKEN")
        if not hf_token:
            raise ValueError("Please set the HF_TOKEN environment variable")

        # 3) Your system prompt—exactly as before
        self._system_msg = (
            "You are a seasoned financial analyst. "
            "When given a stock ticker or company name, "
            "produce a concise, professional financial report "
            "covering key metrics, recent performance, and outlook."
            "make it short, around 200 words"
        )

        # 4) Instantiate the InferenceClient and store it privately
        self._client = InferenceClient(
            model=model_id,
            token=hf_token
        )

    @property
    def _llm_type(self) -> str:
        # Required by LangChain’s LLM base class
        return "huggingface_inference"

    def _call(self, user_prompt: str, **kwargs) -> str:

        # 1) Call inference
        response = self._client.chat_completion(
        messages=[
            {"role": "system", "content": self._system_msg},
            {"role": "user",   "content": user_prompt},
        ],
        max_tokens=300,
        temperature=0.0,
    )

        return response.choices[0].message["content"].strip()


    async def _acall(self, user_prompt: str, **kwargs) -> str:
        # Async variant if needed
        return self._call(user_prompt, **kwargs)

    def generate_report(self, message: str) -> str:
        # Backward-compatible alias
        return self._call(message)
