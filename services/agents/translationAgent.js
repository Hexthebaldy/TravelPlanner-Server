const { createOpenAIModel } = require('../../config/langchain');
const { PromptTemplate } = require('langchain/prompts');
const { LLMChain } = require('langchain/chains');
const logger = require('../../utils/logger');

// 翻译提示模板
const translationPrompt = PromptTemplate.fromTemplate(`
你是一个专业的翻译助手。请将以下文本从{sourceLanguage}翻译成{targetLanguage}：

文本: {text}

请提供准确、自然的翻译，保持原文的语气和风格。
`);

// 对话翻译提示模板
const conversationPrompt = PromptTemplate.fromTemplate(`
你是一个专业的旅行翻译助手。请帮助以下对话场景中的旅行者：

场景: {scenario}
旅行者说(语言:{travelerLanguage}): {travelerSpeech}
目标语言: {targetLanguage}

请提供以下内容：
1. 旅行者话语的翻译
2. 适合该场景的回应建议
3. 回应建议的翻译回旅行者的语言
`);

class TranslationAgent {
  constructor() {
    this.model = createOpenAIModel(0.5); // 较低的温度以确保翻译准确性
    this.translationChain = new LLMChain({
      llm: this.model,
      prompt: translationPrompt,
    });
    this.conversationChain = new LLMChain({
      llm: this.model,
      prompt: conversationPrompt,
    });
  }

  async translateText(text, sourceLanguage, targetLanguage) {
    try {
      const result = await this.translationChain.call({
        text,
        sourceLanguage,
        targetLanguage,
      });
      
      return {
        success: true,
        translation: result.text,
      };
    } catch (error) {
      logger.error(`翻译失败: ${error.message}`);
      return {
        success: false,
        error: '翻译失败，请稍后重试',
      };
    }
  }

  async translateConversation(scenario, travelerSpeech, travelerLanguage, targetLanguage) {
    try {
      const result = await this.conversationChain.call({
        scenario,
        travelerSpeech,
        travelerLanguage,
        targetLanguage,
      });
      
      // 解析结果
      const lines = result.text.split('\n').filter(line => line.trim());
      const translation = lines.find(line => line.includes('1.'))?.replace('1.', '').trim() || '';
      const suggestion = lines.find(line => line.includes('2.'))?.replace('2.', '').trim() || '';
      const reverseTranslation = lines.find(line => line.includes('3.'))?.replace('3.', '').trim() || '';
      
      return {
        success: true,
        translation,
        suggestion,
        reverseTranslation,
      };
    } catch (error) {
      logger.error(`对话翻译失败: ${error.message}`);
      return {
        success: false,
        error: '对话翻译失败，请稍后重试',
      };
    }
  }
}

module.exports = new TranslationAgent();