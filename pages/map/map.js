const app = getApp();
const user = require("../../utils/user.js");
const { request } = require("../../utils/request");
const { calculateDistance } = require("../../utils/distanceUtils")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userLocation:{
      longitude:0,
      latitude:0,
    },//用户当前位置
    scale:18,
    polyline:[],
    markers:[],
    includePoints:[],
    resourceTypes: [], // 资源类型列表
    activeTypeId: null, // 当前选中的资源类型ID
    showDialog: false, // 是否显示导航确认弹窗
    selectedLocation: null, // 当前选中的地点信息
    destination: null, // 目的地坐标
    isNavigating: false,
    updateInterval: null,
    lastUpdateTime: 0,
    arrivalCount: 0 
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.fetchType();
    this.initLocal();// 获取用户位置
  },
  initLocal() {
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => { // 使用箭头函数
        this.setData({
          userLocation:{
            latitude: res.latitude,
            longitude: res.longitude,
          }
        });
      },
      fail: (err) => {
        console.error("获取位置失败", err);
        wx.showToast({
          title: "无法获取当前位置",
          icon: "none",
        });
      },
    });
  },

  /**
   * 获取资源类型
   */
  async fetchType() {
    try {
      const serverRes = await request({
        url: app.globalData.URL+"navigation/pointType",
        method: "GET",
      });
      console.log("返回点位类型:", serverRes.data);
      this.setData({
        resourceTypes: serverRes.data.map(item => ({
          id: item.id,
          typeName: item.typeName,
          icon: item.iconUrl, // 假设后端返回了图标URL
        })),
      });
    } catch (error) {
      console.error("获取资源类型失败", error);
      wx.showToast({
        title: "加载资源类型失败",
        icon: "none",
      });
    }
  },
    /**
   * 切换资源类型
   */
  switchResource(e) {
    const typeId = e.currentTarget.dataset.id;
    this.setData({
      activeTypeId: typeId,
    });
    // 根据选中的资源类型，加载对应的标记点
    this.loadMarkersByType(typeId);
  },
    /**
   * 加载指定类型的标记点
   */
  async loadMarkersByType(typeId) {
    try {
      // 检查用户是否登录
      if (!user.isLoggedIn()) {
        const loginModal = await new Promise((resolve) => {
          wx.showModal({
            title: '用户登录',
            content: '是否继续用户登录？',
            success(res) {
              resolve(res.confirm); // 用户点击“确定”返回 true，否则返回 false
            },
          });
        });
  
        if (!loginModal) {
          console.log("用户取消登录");
          return; // 如果用户取消登录，直接退出函数
        }
  
        // 执行登录操作
        await app.wxLogin();
      }
  
      // 请求标记点数据
      const serverRes = await request({
        url: app.globalData.URL+`navigation/point_pointType?Id=${typeId}`,
        method: "GET",
      });
  
      console.log("返回标记点数据:", serverRes.data);
  
      // 处理返回的标记点数据
      const markers = serverRes.data.map(item => ({
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        callout: {
          content: item.name || "未知地点",
          color: "#40D1AE",
          fontSize: 14,
          borderRadius: 5,
          padding: 10,
          display: "ALWAYS",
        },
        description: item.description || "暂无描述",
        iconPath: item.iconUrl || "/images/default-marker.png", // 默认图标
        width: 30, // 图标宽度（单位：px）
        height: 30, // 图标高度（单位：px）
        image: item.imageUrl || '/images/default-location.png', // 地点图片
      }));
      // 更新页面数据
      this.setData({
        // polyline,
        markers,
        includePoints: markers.map(marker => ({
          latitude: marker.latitude,
          longitude: marker.longitude,
          })
        ),
      });
  
    } catch (error) {
      console.error("加载标记点失败:", error);
      wx.showToast({
        title: "加载标记点失败，请稍后重试",
        icon: "none",
      });
    }
  },
   /**
   * 地图放大
   */
  zoomIn() {
    this.setData({
      scale: Math.min(this.data.scale + 1, 20), // 最大缩放级别为20
    });
  },

  /**
   * 地图缩小
   */
  zoomOut() {
    this.setData({
      scale: Math.max(this.data.scale - 1, 3), // 最小缩放级别为3
    });
  },

  /**
   * 切换地图图层
   */
  switchLayer() {
    wx.showToast({
      title: "切换图层功能暂未实现",
      icon: "none",
    });
  },

  /**
   * 处理标记点点击事件
   */
  handleMarkerTap(e) {
    const markerId = e.detail.markerId;
    const selectedLocation = this.data.markers.find(marker => marker.id === markerId);
    if (selectedLocation) {
      this.setData({
        showDialog: true,
        selectedLocation,
      });
    }
  },
   /**
   * 取消导航
   */
  cancelNavigation() {
    this.setData({
      showDialog: false,
      selectedLocation: null,
    });
  },

  /**
   * 开始导航
   */
  async startNavigation() {
    try {
      const { latitude, longitude } = this.data.selectedLocation;

      // 请求导航路线数据
      const serverRes = await request({
        url: app.globalData.URL+"navigation/navigation",
        method: "POST",
        data: {
          startLat: this.data.userLocation.latitude,
          startLng: this.data.userLocation.longitude,
          endLat: latitude,
          endLng: longitude,
        },
      });
  
      console.log("返回导航路线数据:", serverRes);
  
      if (serverRes.code === 1 && serverRes.data) {
        this.updateRoute(serverRes.data); // 更新初始路线
        // 存储目的地坐标
        this.setData({
          destination: { latitude, longitude },
          isNavigating: true
        });
        // 清除已有定时器
        if (this.data.updateInterval) {
          clearInterval(this.data.updateInterval);
        }
        // 启动定时更新
        const intervalId = setInterval(() => {
          this.updateLocationAndRoute();
        }, 1000);
        
        this.setData({ updateInterval: intervalId });
      } else {
        console.error("导航数据获取失败");
        wx.showToast({
          title: "导航数据获取失败",
          icon: "none",
        });
      }
    } catch (error) {
      console.error("导航请求失败:", error);
      wx.showToast({
        title: "导航请求失败，请稍后重试",
        icon: "none",
      });
    }
  },

    /**
   * 更新定位和路线
   */
  async updateLocationAndRoute() {
    try {
      const authStatus = await wx.getSetting({});
      if (!authStatus.authSetting['scope.userLocation']) {
          wx.showToast({ title: '请开启定位权限', icon: 'none' });
          return;
      }
      // 获取最新位置
      const location = await new Promise((resolve, reject) => {
        wx.getLocation({
          type: 'gcj02',
          isHighAccuracy: true,
          success: resolve,
          fail: (err) => {
            wx.showToast({ title: `定位失败:${err.errMsg}`, icon: 'none' });
            reject(err);
          }
        });
      });

      // 更新用户位置
      this.setData({
        userLocation: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      });

      // 到达判断
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        this.data.destination.latitude,
        this.data.destination.longitude
      );
      if(distance <= 2){
          this.data.arrivalCount++;
          if(this.data.arrivalCount >= 3){
              wx.showToast({ title: '已到达目的地', icon: 'success' });
              return this.stopNavigation();
          }
      } else {
          this.setData({ arrivalCount: 0 });
      }
      // 频率控制
      if(Date.now() - this.data.lastUpdateTime < 1000) return;
      // 请求路线更新
      const serverRes = await request({
        url: app.globalData.URL + "navigation/update",
        method: "POST",
        data: {
          currentLat: location.latitude,
          currentLng: location.longitude,
          endLat: this.data.destination.latitude,
          endLng: this.data.destination.longitude
        }
      });

      if (serverRes.code === 1 && serverRes.data) {
        const newRoute = serverRes.data;
        // 对比路线差异
        if (!this.isSameRoute(newRoute)) {
          this.updateRoute(newRoute);
        }
      } else {
        wx.showToast({ title: '路线更新失败', icon: 'none' });
    }
    this.setData({ lastUpdateTime: Date.now() });
    } catch (error) {
      console.error('定位更新失败:', error);
    }
  },

  /**
   * 路线对比
   */
  isSameRoute(newRouteData) {
    const oldPoints = this.data.polyline[0]?.points || [];
    const newPoints = newRouteData.map(p => ({
      latitude: p.endLatitude,
      longitude: p.endLongitude
    }));
    
    return JSON.stringify(oldPoints) === JSON.stringify(newPoints);
  },

  /**
   * 结束导航
   */
  stopNavigation() {
    if (this.data.updateInterval) {
      clearInterval(this.data.updateInterval);
      this.setData({
        updateInterval: null,
        isNavigating: false,
        polyline: [],
        markers: [],
        destination: null
      });
      wx.showToast({
        title: '导航已结束',
        icon: 'success'
      });
    }
  },

  /**
   * 更新路线
   */
  updateRoute(routeData) {
    const routePoints = routeData.map(point => ({
      latitude: point.endLatitude,
      longitude: point.endLongitude,
    }));

    const polyline = [{
      points: routePoints,
      color: "#FF0000", // 路线颜色
      width: 6, // 路线宽度
      dottedLine: false, // 是否虚线
    }];
    this.setData({
      showDialog:false,
      selectedLocation:null,
      polyline: polyline,
      markers: [
        {
          id: 1,
          latitude: this.data.userLocation.latitude,
          longitude: this.data.userLocation.longitude,
          iconPath: "/images/start.png", // 起点图标
          width: 30,
          height: 30,
        },
        {
          id: 2,
          latitude: routePoints[routePoints.length - 1].latitude,
          longitude: routePoints[routePoints.length - 1].longitude,
          iconPath: "/images/end.png", // 终点图标
          width: 30,
          height: 30,
        },
      ],
    });
  },


  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 地球半径，单位米
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 返回距离，单位米
  },
    /**
   * 跳转到搜索页面
   */
  ToSearch() {
    wx.navigateTo({
      url: "/pages/search/search",
    });
  },
  /**
   * 页面卸载时关闭 WebSocket
   */
  onUnload() {
    if (this.data.websocket) {
      this.data.websocket.close();
    }
  },


})