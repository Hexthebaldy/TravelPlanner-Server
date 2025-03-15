const { createOpenAIModel } = require('../../config/langchain');
const { PromptTemplate } = require('langchain/prompts');
const { LLMChain } = require('langchain/chains');
const flightService = require('../external/flightService');// 引入航班服务
const logger = require('../../utils/logger');

// 交通建议提示模板
const transportPrompt = PromptTemplate.fromTemplate(`
你是一个专业的交通规划助手。请根据以下信息为用户提供最佳交通方案：

出发地: {origin}
目的地: {destination}
出发日期: {departureDate}
返回日期: {returnDate}
预算: {budget}
偏好的交通方式: {preferredMode}
旅客人数: {passengers}
特殊要求: {specialRequirements}

请考虑时间、成本、便利性和舒适度，提供详细的交通建议。
`);

class TransportAgent {
  constructor() {
    this.model = createOpenAIModel(0.7);
    this.chain = new LLMChain({
      llm: this.model,
      prompt: transportPrompt,
    });
  }

  async getTransportRecommendations(transportData) {
    try {
      // 获取实时航班信息
      let flightInfo = {};
      if (transportData.preferredMode === '飞机' || transportData.preferredMode === '所有') {
        flightInfo = await flightService.getFlightInfo(
          transportData.origin,
          transportData.destination,
          transportData.departureDate
        );
      }
      
      const result = await this.chain.call({
        ...transportData,
        flightInfo: JSON.stringify(flightInfo),
      });
      
      return {
        success: true,
        recommendations: result.text,
        realTimeData: {
          flights: flightInfo,
        },
      };
    } catch (error) {
      logger.error(`交通建议生成失败: ${error.message}`);
      return {
        success: false,
        error: '交通建议生成失败，请稍后重试',
      };
    }
  }

  async getTransportStatus(transportType, transportId) {
    // 实现交通状态查询逻辑
    try {
      let statusInfo = {};
      
      if (transportType === 'flight') {
        statusInfo = await flightService.getFlightStatus(transportId);
      } else if (transportType === 'train') {
        // 实现火车状态查询
      }
      
      return {
        success: true,
        status: statusInfo,
      };
    } catch (error) {
      logger.error(`交通状态查询失败: ${error.message}`);
      return {
        success: false,
        error: '交通状态查询失败，请稍后重试',
      };
    }
  }
}

module.exports = new TransportAgent();