/**
 * 计算两个经纬度点之间的距离（单位：米）
 * @param {number} lat1 - 点1的纬度
 * @param {number} lng1 - 点1的经度
 * @param {number} lat2 - 点2的纬度
 * @param {number} lng2 - 点2的经度
 * @returns {number} - 两点之间的距离（单位：米）
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // 地球半径（单位：米）
  const φ1 = (lat1 * Math.PI) / 180; // 将纬度转换为弧度
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 返回距离（单位：米）
}

module.exports = {
  calculateDistance,
};