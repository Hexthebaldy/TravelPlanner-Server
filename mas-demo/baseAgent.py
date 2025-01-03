from openai import OpenAI

class BaseAgent:
    def __init__(self, model, api_key, base_url):
        self.model = model
        self.api_key = api_key
        self.base_url = base_url
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )

    def ask_llm(self,prompt,system_role=""):
        response = self.cilent.chat.completions.create(
            model = "deepseek-chat",
            messages = [
                {"role": "system", "content": system_role},
                {"role": "user", "content": prompt},
            ],
            stream = False
        )
        return response.choices[0].message.content