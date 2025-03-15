const axios = require('axios');
const logger = require('../../utils/logger');
const AppError = require('../../utils/appError');

class MapService {
  constructor() {
    this.apiKey = process.env.MAP_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  async searchPlaces(query, location, radius = 5000, type = '') {
    try {
      const response = await axios.get(`${this.baseUrl}/place/textsearch/json`, {
        params: {
          query,
          location,
          radius,
          type,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new AppError(`地点搜索失败: ${response.data.status}`, 400);
      }

      return response.data.results;
    } catch (error) {
      logger.error(`地点搜索错误: ${error.message}`);
      throw new AppError('无法搜索地点', 500);
    }
  }

  async getPlaceDetails(placeId) {
    try {
      const response = await axios.get(`${this.baseUrl}/place/details/json`, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,geometry,photos,rating,opening_hours,website,price_level,reviews',
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new AppError(`获取地点详情失败: ${response.data.status}`, 400);
      }

      return response.data.result;
    } catch (error) {
      logger.error(`获取地点详情错误: ${error.message}`);
      throw new AppError('无法获取地点详情', 500);
    }
  }

  async getDirections(origin, destination, mode = 'driving', waypoints = []) {
    try {
      const waypointsParam = waypoints.length > 0 ? waypoints.join('|') : '';
      
      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin,
          destination,
          mode,
          waypoints: waypointsParam,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new AppError(`获取路线失败: ${response.data.status}`, 400);
      }

      return response.data.routes;
    } catch (error) {
      logger.error(`获取路线错误: ${error.message}`);
      throw new AppError('无法获取路线', 500);
    }
  }

  async searchRestaurants(location, cuisine = '', budget = '') {
    try {
      let query = 'restaurants';
      if (cuisine) {
        query += ` ${cuisine}`;
      }
      if (budget === 'low') {
        query += ' cheap';
      } else if (budget === 'high') {
        query += ' expensive';
      }

      return await this.searchPlaces(query, location, 5000, 'restaurant');
    } catch (error) {
      logger.error(`搜索餐厅错误: ${error.message}`);
      throw new AppError('无法搜索餐厅', 500);
    }
  }

  async searchActivities(location, activityType = '', budget = '') {
    try {
      let query = activityType || 'tourist attractions';
      if (budget === 'low') {
        query += ' cheap';
      } else if (budget === 'high') {
        query += ' expensive';
      }

      return await this.searchPlaces(query, location, 10000);
    } catch (error) {
      logger.error(`搜索活动错误: ${error.message}`);
      throw new AppError('无法搜索活动', 500);
    }
  }

  async getWeather(location, date) {
    // 这里应该集成实际的天气API，这里只是模拟
    try {
      // 模拟天气数据
      const weatherData = {
        location,
        date,
        temperature: Math.floor(Math.random() * 30) + 5,
        condition: ['晴朗', '多云', '小雨', '大雨'][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 50) + 30,
        windSpeed: Math.floor(Math.random() * 30)
      };
      
      return weatherData;
    } catch (error) {
      logger.error(`获取天气错误: ${error.message}`);
      throw new AppError('无法获取天气信息', 500);
    }
  }
}

module.exports = new MapService();