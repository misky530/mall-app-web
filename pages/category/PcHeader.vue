<template>
	<!-- #ifdef H5 -->
	<view class="pc-header-wrapper">
		<view class="pc-header">
			<view class="logo" @click="goHome">
				<image src="/static/logo.png" mode="heightFix"></image>
				<text>mall</text>
			</view>
			<view class="nav-links">
				<view class="nav-item" :class="{active: currentPath === '/pages/index/index'}" @click="switchTab('/pages/index/index')">首页</view>
				<view class="nav-item" :class="{active: currentPath === '/pages/category/category'}" @click="switchTab('/pages/category/category')">分类</view>
				<view class="nav-item" :class="{active: currentPath === '/pages/cart/cart'}" @click="switchTab('/pages/cart/cart')">购物车</view>
				<view class="nav-item" :class="{active: currentPath === '/pages/user/user'}" @click="switchTab('/pages/user/user')">我的</view>
			</view>
			<view class="user-section">
				<!-- 这里可以添加搜索框或用户信息 -->
				<text class="yticon icon-sousuo"></text>
				<input class="search-input" type="text" placeholder="搜索商品" />
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
		created() {
			// #ifdef H5
			this.currentPath = '/' + window.location.hash.split('?')[0].substring(1);
			// #endif
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
			display: flex;
			justify-content: center;
			width: 100%;
			background-color: #fff;
			border-bottom: 1px solid #e5e5e5;
			box-shadow: 0 2px 4px rgba(0,0,0,.05);
			position: sticky;
			top: 0;
			z-index: 999;
		}

		.pc-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			width: 100%;
			max-width: 1200px;
			height: 60px;
			padding: 0 20px;
		}

		.logo {
			display: flex;
			align-items: center;
			cursor: pointer;
			image {
				height: 35px;
				margin-right: 10px;
			}
			text {
				font-size: 24px;
				font-weight: bold;
				color: $font-color-dark;
			}
		}

		.nav-links {
			display: flex;
			.nav-item {
				padding: 0 20px;
				font-size: 16px;
				cursor: pointer;
				color: $font-color-base;
				transition: color .2s;
				&:hover, &.active {
					color: $uni-color-primary;
				}
			}
		}

		.user-section {
			/* 样式留空，可后续添加 */
		}
	}
</style>