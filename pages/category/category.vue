<template>
	<view class="pc-wrapper">
		<PcHeader />
		<view class="pc-container">
			<view class="content">
				<view class="left-aside">
					<view v-for="item in flist" :key="item.id" class="f-item b-b" :class="{active: item.id === currentId}" @click="tabtap(item)">
						{{item.name}}
					</view>
				</view>
				<view class="right-aside">
					<view class="s-list">
						<view @click="navToList(item.id)" class="s-item" v-for="item in slist" :key="item.id">
							<image :src="item.icon||'http://macro-oss.oss-cn-shenzhen.aliyuncs.com/mall/images/20190519/default.png'"></image>
							<text>{{item.name}}</text>
						</view>
					</view>
				</view>
			</view>
			<PcFooter />
		</view>
	</view>
</template>

<script>
	import {
		fetchProductCateList
	} from '@/api/home.js';
	export default {
		data() {
			return {
				currentId: 0,
				flist: [],
				slist: []
			}
		},
		onLoad() {
			this.loadData();
		},
		methods: {
			async loadData() {
				fetchProductCateList(0).then(response => {
					this.flist = response.data;
					if (this.flist.length > 0) {
						this.currentId = this.flist[0].id;
						fetchProductCateList(this.currentId).then(response => {
							this.slist = response.data;
						});
					}
				})
			},
			//一级分类点击
			tabtap(item) {
				this.currentId = item.id;
				fetchProductCateList(this.currentId).then(response => {
					this.slist = response.data;
				});
			},
			navToList(sid) {
				uni.navigateTo({
					url: `/pages/product/list?fid=${this.currentId}&sid=${sid}`
				})
			}
		}
	}
</script>

<style lang='scss'>
	/* #ifdef H5 */
	.pc-wrapper {
		display: flex;
		justify-content: center;
		background-color: #f8f8f8;
		min-height: 100vh;
	}

	.pc-container {
		max-width: 1200px;
		width: 100%;
		background-color: #fff;
		box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
		padding: 20px;
	}

	@media (min-width: 768px) {
		.left-aside {
			width: 200px; /* PC端左侧导航固定宽度 */
		}
		.f-item {
			font-size: 16px; /* 增大字体 */
			height: 50px;
		}
		.right-aside {
			padding-left: 20px;
		}
		.s-list {
			margin-top: 0;
		}
		.s-item {
			width: 20%; /* PC端显示5列 */
			font-size: 14px;
			image {
				width: 100px;
				height: 100px;
			}
		}
	}
	/* #endif */

	page,
	.content {
		height: 100%;
		background-color: #f8f8f8;
	}

	.content {
		display: flex;
	}

	.left-aside {
		flex-shrink: 0;
		width: 200upx;
		height: 100%;
		background-color: #fff;
	}

	.f-item {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100upx;
		font-size: 28upx;
		color: $font-color-base;
		position: relative;

		&.active {
			color: $base-color;
			background: #f8f8f8;

			&:before {
				content: '';
				position: absolute;
				left: 0;
				top: 50%;
				transform: translateY(-50%);
				height: 36upx;
				width: 8upx;
				background-color: $base-color;
				border-radius: 0 4px 4px 0;
				opacity: .8;
			}
		}
	}

	.right-aside {
		flex: 1;
		overflow: hidden;
		padding-left: 20upx;
	}

	.s-list {
		margin-top: 20upx;
		display: flex;
		flex-wrap: wrap;
		width: 100%;
		background: #fff;
		padding-top: 12upx;

		&:after {
			content: '';
			flex: 99;
			height: 0;
		}
	}

	.s-item {
		flex-shrink: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		width: 176upx;
		font-size: 26upx;
		color: #666;
		padding-bottom: 20upx;

		image {
			width: 140upx;
			height: 140upx;
		}
	}
</style>
