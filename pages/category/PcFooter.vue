<template>
	<!-- #ifdef H5 -->
	<view class="pc-footer-wrapper">
		<view class="footer-main">
			<view class="footer-slogan">
				<view class="slogan-item">
					<text class="yticon icon-kafei"></text>
					<text>品质保障</text>
				</view>
				<view class="slogan-item">
					<text class="yticon icon-shouhoutuikuan"></text>
					<text>无忧退换</text>
				</view>
				<view class="slogan-item">
					<text class="yticon icon-yishouhuo"></text>
					<text>准时发货</text>
				</view>
				<view class="slogan-item">
					<text class="yticon icon-dianhua-copy"></text>
					<text>7×24小时服务</text>
				</view>
			</view>
		</view>
		<view class="footer-copyright">
			<view class="copyright-content">
				<text>Copyright © 2020-2024 mall-app-web All Rights Reserved.</text>
				<text>基于 mall-swarm 微服务电商项目构建</text>
			</view>
		</view>
	</view>
	<!-- #endif -->
</template>

<script>
	export default {
		name: "PcFooter",
		data() {
			return {

			};
		}
	}
</script>

<style lang="scss">
	.pc-footer-wrapper {
		display: none;
		/* 默认在移动端隐藏 */
	}

	@media (min-width: 768px) {
		.pc-footer-wrapper {
			display: block;
			width: 100%;
			background-color: #fff;
			margin-top: 40px;
			border-top: 1px solid #e5e5e5;
		}

		.footer-main {
			display: flex;
			justify-content: center;
			padding: 40px 0;
		}

		.footer-slogan {
			display: flex;
			align-items: center;
			justify-content: space-around;
			width: 100%;
			max-width: 1200px;
		}

		.footer-copyright {
			background-color: #333;
			color: #999;
			padding: 20px 0;
		}
	}
</style>