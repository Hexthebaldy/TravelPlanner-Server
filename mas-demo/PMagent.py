from openai import OpenAI

client = OpenAI(
    api_key="sk-76948d462c194ec2953200b280d04894",
    base_url="https://api.deepseek.com/v1"
)

task = input("请输入您的需求：")

response = client.chat.completions.create(
    model = "deepseek-chat",
    messages = [
        # 系统提示
        {"role": "system", "content": "You are a project manager in a software company"},
        # 用户输入
        {"role": "user", "content": task},
    ],
    stream = False
)

# print(response.choices[0].message.content)

#将response.choices[0].message.content写入文件
# with open("game.py", "w") as f:
#     f.write(response.choices[0].message.content)



