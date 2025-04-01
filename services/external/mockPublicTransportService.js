const { transport } = require("winston");

// mock
const findTransportPlans = (d1,d2)=>{
    let plans = [{
        transport: "火车",
        start: d1,
        end: d2,
        time: "2025-05-01 08:00",
        duration: "3小时",
        price: "100元",
        seat: "一等座",
        ticket: "123456"
    },{
        transport: "火车",
        start: d1,
        end: d2,
        time: "2025-05-01 12:00",
        duration: "2小时",
        price: "80元",
        seat: "二等座",
        ticket: "654321"
    },{
        transport: "飞机",
        start: d1,
        end: d2,
        time: "2025-05-01 14:00",
        duration: "1小时",
        price: "500元",
        seat: "头等舱",
        ticket: "111111"
    },{
        transport: "飞机",
        start: d1,
        end: d2,
        time: "2025-05-01 18:00",
        duration: "1小时",
        price: "400元",
        seat: "商务舱",
        ticket: "222222"
    },{
    }];


    return plans;
};

module.exports = {
    findTransportPlans
}