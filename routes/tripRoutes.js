const express = require('express');
const {
  createTrip,
  getTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  getTripTransport,
  getTripAccommodation,
  getTripActivities,
  getTripFood
} = require('../controllers/tripController');

const { protect } = require('../middleware/authMiddleware'); //权限控制中间件，用于验证用户身份。

const router = express.Router();

// 基本行程路由
router.route('/')
  .get(protect, getTrips)
  .post(protect, createTrip);

router.route('/:id')
  .get(protect, getTrip)
  .put(protect, updateTrip)
  .delete(protect, deleteTrip);

// 行程相关服务路由
router.get('/:id/transport', protect, getTripTransport);
router.get('/:id/accommodation', protect, getTripAccommodation);
router.get('/:id/activities', protect, getTripActivities);
router.get('/:id/food', protect, getTripFood);

module.exports = router;