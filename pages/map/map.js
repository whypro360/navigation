const app = getApp();
const user = require("../../utils/user.js");
const { request } = require("../../utils/request");
Page({

  /**
   * 页面的初始数据
   */
  data: {
    longitude:0,
    latitude:0,
    scale:18,
    polyline:[],
    markers:[],
    includePoints:[],
    resourceTypes: [], // 资源类型列表
    activeTypeId: null, // 当前选中的资源类型ID
    showDialog: false, // 是否显示导航确认弹窗
    selectedLocation: null, // 当前选中的地点信息
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initLocal();
    this.fetchType();
  },
  initLocal() {
    wx.getLocation({
      type: "wgs84",
      isHighAccuracy: true,
      success: (res) => { // 使用箭头函数
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
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
        url: "http://localhost:8080/navigation/pointType",
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
        url: `http://localhost:8080/navigation/point_pointType?Id=${typeId}`,
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
        markers,
        includePoints: markers.map(marker => ({
          latitude: marker.latitude,
          longitude: marker.longitude,
        })),
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
        url: "http://localhost:8080/navigation/navigation",
        method: "POST",
        data: {
          startLat: this.data.latitude,
          startLng: this.data.longitude,
          endLat: latitude,
          endLng: longitude,
        },
      });
  
      console.log("返回导航路线数据:", serverRes);
  
      if (serverRes.code === 1 && serverRes.data) {
        const routePoints = serverRes.data.map(point => ({
          latitude: point.lat, // 假设返回数据中包含 lat 和 lng 字段
          longitude: point.lng,
        }));
  
        // 设置导航路线的 polyline 数据
        const polyline = [{
          points: routePoints,
          color: "#FF0000", // 路线颜色
          width: 6, // 路线宽度
          dottedLine: false, // 是否虚线
        }];
  
        // 更新页面数据
        this.setData({
          showDialog: false,
          selectedLocation: null,
          polyline: polyline, // 地图上的导航路线
          markers: [
            {
              id: 1,
              latitude: this.data.latitude,
              longitude: this.data.longitude,
              iconPath: "/images/start.png", // 起点图标
              width: 30,
              height: 30,
            },
            {
              id: 2,
              latitude: latitude,
              longitude: longitude,
              iconPath: "/images/end.png", // 终点图标
              width: 30,
              height: 30,
            },
          ],
        });
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
   * 跳转到搜索页面
   */
  ToSearch() {
    wx.navigateTo({
      url: "/pages/search/search",
    });
  },
})