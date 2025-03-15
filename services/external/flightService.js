const axios = require('axios');
const logger = require('../../utils/logger');
const AppError = require('../../utils/appError');

class FlightService {
  constructor() {
    this.apiKey = process.env.FLIGHT_API_KEY;
    this.baseUrl = 'https://api.flightapi.example.com'; // 替换为实际的航班API
  }

  async getFlightInfo(origin, destination, date) {
    try {
      // 实际项目中应该调用真实的航班API
      // 这里模拟API调用
      /*
      const response = await axios.get(`${this.baseUrl}/flights`, {
        params: {
          origin,
          destination,
          date,
          key: this.apiKey
        }
      });
      */
      
      // 模拟数据
      const flights = [
        {
          id: 'FL123',
          airline: '中国国际航空',
          flightNumber: 'CA1234',
          origin,
          destination,
          departureTime: `${date}T08:00:00`,
          arrivalTime: `${date}T10:30:00`,
          duration: '2h 30m',
          price: Math.floor(Math.random() * 2000) + 1000,
          currency: 'CNY',
          cabinClass: 'Economy',
          seatsAvailable: Math.floor(Math.random() * 50) + 1
        },
        {
          id: 'FL124',
          airline: '东方航空',
          flightNumber: 'MU5678',
          origin,
          destination,
          departureTime: `${date}T12:15:00`,
          arrivalTime: `${date}T14:45:00`,
          duration: '2h 30m',
          price: Math.floor(Math.random() * 2000) + 1000,
          currency: 'CNY',
          cabinClass: 'Economy',
          seatsAvailable: Math.floor(Math.random() * 50) + 1
        },
        {
          id: 'FL125',
          airline: '南方航空',
          flightNumber: 'CZ9012',
          origin,
          destination,
          departureTime: `${date}T16:30:00`,
          arrivalTime: `${date}T19:00:00`,
          duration: '2h 30m',
          price: Math.floor(Math.random() * 2000) + 1000,
          currency: 'CNY',
          cabinClass: 'Economy',
          seatsAvailable: Math.floor(Math.random() * 50) + 1
        }
      ];
      
      return flights;
    } catch (error) {
      logger.error(`获取航班信息错误: ${error.message}`);
      throw new AppError('无法获取航班信息', 500);
    }
  }

  async getFlightStatus(flightId) {
    try {
      // 实际项目中应该调用真实的航班状态API
      // 这里模拟API调用
      /*
      const response = await axios.get(`${this.baseUrl}/status/${flightId}`, {
        params: {
          key: this.apiKey
        }
      });
      */
      
      // 模拟数据
      const statuses = ['准时', '延误', '取消', '登机中', '已起飞'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      const statusInfo = {
        flightId,
        status: randomStatus,
        gate: randomStatus !== '取消' ? `G${Math.floor(Math.random() * 30) + 1}` : null,
        terminal: randomStatus !== '取消' ? `T${Math.floor(Math.random() * 3) + 1}` : null,
        delay: randomStatus === '延误' ? `${Math.floor(Math.random() * 120) + 15}分钟` : null,
        updatedAt: new Date().toISOString()
      };
      
      return statusInfo;
    } catch (error) {
      logger.error(`获取航班状态错误: ${error.message}`);
      throw new AppError('无法获取航班状态', 500);
    }
  }
}

module.exports = new FlightService();