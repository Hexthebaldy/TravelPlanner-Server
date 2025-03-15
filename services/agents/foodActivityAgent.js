const { createOpenAIModel } = require('../../config/langchain');
const { PromptTemplate } = require('langchain/prompts');
const { LLMChain } = require('langchain/chains');
const mapService = require('../external/mapService');
const logger = require('../../utils/logger');

// 美食推荐提示模板
const foodPrompt = PromptTemplate.fromTemplate(`
你是一个专业的美食顾问。请根据以下信息为用户推荐餐厅：

目的地: {destination}
用餐日期: {date}
用餐时间: {time}
预算: {budget}
口味偏好: {cuisinePreferences}
饮食限制: {dietaryRestrictions}
人数: {people}
场合: {occasion}
可用的餐厅选项: {availableOptions}

请考虑位置、价格、菜系、评价和特殊需求，提供详细的餐厅建议。
`);

// 活动推荐提示模板
const activityPrompt = PromptTemplate.fromTemplate(`
你是一个专业的旅行活动顾问。请根据以下信息为用户推荐活动：

目的地: {destination}
日期: {date}
时间: {time}
预算: {budget}
兴趣: {interests}
活动类型: {activityType}
人数: {people}
天气: {weather}
可用的活动选项: {availableOptions}

请考虑位置、价格、类型、评价和天气条件，提供详细的活动建议。
`);

class FoodActivityAgent {
  constructor() {
    this.model = createOpenAIModel(0.7);
    this.foodChain = new LLMChain({
      llm: this.model,
      prompt: foodPrompt,
    });
    this.activityChain = new LLMChain({
      llm: this.model,
      prompt: activityPrompt,
    });
  }

  async getRestaurantRecommendations(foodData) {
    try {
      // 获取实时餐厅信息
      const availableOptions = await mapService.searchRestaurants(
        foodData.destination,
        foodData.cuisinePreferences,
        foodData.budget
      );
      
      const result = await this.foodChain.call({
        ...foodData,
        availableOptions: JSON.stringify(availableOptions.slice(0, 8)),
      });
      
      return {
        success: true,
        recommendations: result.text,
        options: availableOptions.slice(0, 8),
      };
    } catch (error) {
      logger.error(`餐厅推荐生成失败: ${error.message}`);
      return {
        success: false,
        error: '餐厅推荐生成失败，请稍后重试',
      };
    }
  }

  async getActivityRecommendations(activityData) {
    try {
      // 获取实时活动信息
      const availableOptions = await mapService.searchActivities(
        activityData.destination,
        activityData.activityType,
        activityData.budget
      );
      
      // 获取天气信息
      const weather = await mapService.getWeather(activityData.destination, activityData.date);
      
      const result = await this.activityChain.call({
        ...activityData,
        weather: JSON.stringify(weather),
        availableOptions: JSON.stringify(availableOptions.slice(0, 8)),
      });
      
      return {
        success: true,
        recommendations: result.text,
        options: availableOptions.slice(0, 8),
        weather,
      };
    } catch (error) {
      logger.error(`活动推荐生成失败: ${error.message}`);
      return {
        success: false,
        error: '活动推荐生成失败，请稍后重试',
      };
    }
  }
}

module.exports = new FoodActivityAgent();