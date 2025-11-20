<template>
	<!-- #ifdef H5 -->
	<view class="pc-header-wrapper">
		<view class="header-top-bar">
			<view class="top-bar-content">
				<view class="left">欢迎来到 mall 商城！</view>
				<view class="right">
					<text class="nav-item">登录</text>
					<text class="nav-item">注册</text>
					<view class="separator">|</view>
					<text class="nav-item">我的订单</text>
				</view>
			</view>
		</view>
		<view class="main-header">
			<view class="main-header-content">
				<view class="logo" @click="goHome">
					<image src="/static/logo.png" mode="heightFix"></image>
					<text>mall</text>
				</view>
				<view class="search-box">
					<input class="search-input" type="text" placeholder="搜索商品" />
					<button class="search-btn">搜索</button>
				</view>
				<view class="cart-box" @click="switchTab('/pages/cart/cart')">
					<text class="yticon icon-gouwuche"></text>
					<text>我的购物车</text>
				</view>
			</view>
		</view>
	</view>
	<!-- #endif -->
</template>

<script>
	export default {
		name: "PcHeader",
		data() {
			return {
				currentPath: ''
			};
		},
		methods: {
			switchTab(url) {
				uni.switchTab({
					url
				});
			},
			goHome() {
				uni.switchTab({
					url: '/pages/index/index'
				})
			}
		}
	}
</script>

<style lang="scss">
	.pc-header-wrapper {
		display: none; /* 默认在移动端隐藏 */
	}

	@media (min-width: 768px) {
		.pc-header-wrapper {
			display: block; /* 改为块级，让 top-bar 和 main-header 垂直排列 */
			width: 100%;
			position: sticky;
			top: 0;
			z-index: 999;
		}

		/* 顶部快捷链接栏 */
		.header-top-bar {
			background-color: #f2f2f2;
			height: 30px;
			font-size: 12px;
			color: #999;
			display: flex;
			justify-content: center;
		}
		.top-bar-content {
			width: 100%;
			max-width: 1200px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 20px;
			.right {
				display: flex;
				align-items: center;
				.nav-item {
					cursor: pointer;
					&:hover {
						color: $uni-color-primary;
					}
				}
				.separator {
					margin: 0 10px;
				}
			}
		}

		/* 主导航区 */
		.main-header {
			background-color: #fff;
			display: flex;
			justify-content: center;
			border-bottom: 1px solid #e5e5e5;
			box-shadow: 0 2px 4px rgba(0,0,0,.05);
		}
		.main-header-content {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			max-width: 1200px;
			height: 80px;
			padding: 0 20px;
		}

		/* Logo */
		.logo {
			display: flex;
			align-items: center;
			cursor: pointer;
			image {
				height: 40px;
				margin-right: 10px;
			}
			text {
				font-size: 28px;
				font-weight: bold;
				color: $font-color-dark;
			}
		}

		/* 搜索框 */
		.search-box {
			display: flex;
			width: 500px;
			height: 40px;
			border: 2px solid $uni-color-primary;
			border-radius: 5px;
			overflow: hidden;
			.search-input {
				flex: 1;
				height: 100%;
				padding: 0 15px;
				font-size: 14px;
				border: none;
				outline: none;
			}
			.search-btn {
				width: 100px;
				height: 100%;
				border: none;
				background-color: $uni-color-primary;
				color: #fff;
				font-size: 16px;
				cursor: pointer;
				border-radius: 0;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}

		/* 购物车 */
		.cart-box {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 150px;
			height: 40px;
			border: 1px solid #e5e5e5;
			cursor: pointer;
			.yticon {
				font-size: 20px;
				margin-right: 8px;
				color: $uni-color-primary;
			}
		}
	}
</style>