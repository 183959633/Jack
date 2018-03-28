import React, { Component } from "react";
import {
	Text,
	View,
	StyleSheet,
	ListView,
	FlatList,
	TouchableOpacity,
	Image,
	Dimensions,
	ActivityIndicator,
	RefreshControl,
	AlertIOS,
	Button
} from "react-native";
import Detail from "./detail.js"
import request from "../common/request.js"
import config from "../common/config.js"
import { Navigation } from 'react-native-navigation'
import Icon from "react-native-vector-icons/Ionicons"
Navigation.registerComponent('Detail', () => Detail)
const width = Dimensions.get("window").width
const cachedResults = {
	nextPage: 1,
	items: [],
	total: 0
}
class Item extends Component {
	constructor(props) {
		super(props)
		let row = this.props.row
		this.state = {
			up: false,
			row: row.item
		}
	}
	_up() {
		let up = !this.state.up
		let row = this.state.row
		let url = config.api.base + config.api.up
		let body = {
			id: row._id,
			up: up ? "yes" : "no",
			accessToken: "aabb"
		}
		request.post(url, body)
			.then((data) => {
				if (data && data.success) {
					this.setState({
						up: up
					})
				} else {
					Toast.showShortBottom("点赞失败,请稍候再试!")
				}
			})
			.catch((e) => {
				console.log(e)
				Toast.showShortBottom("点赞失败,请稍候再试!")
			})
	}
	render() {
		let row = this.state.row
		return (
			<TouchableOpacity
				onPress={this.props.onSelect}
			>
				<View style={styles.item}>
					<Text style={styles.title}>{row._id}</Text>
					<Image
						source={{ uri: row.thumb }}
						style={styles.thumb}>
						<Icon
							style={styles.play}
							name="ios-play"
							size={28}
						/>
					</Image>
					<View style={styles.itemFooter}>
						<View style={styles.handleBox}>
							<Icon
								name={this.state.up ? "ios-heart" : "ios-heart-outline"}
								size={28}
								style={[styles.up, this.state.up ? null : styles.down]}
								onPress={this._up.bind(this)}
							/>
							<Text
								style={styles.handleText}
								onPress={this._up.bind(this)}>喜欢
							</Text>
						</View>
						<View style={styles.handleBox}>
							<Icon
								name="ios-chatboxes-outline"
								size={28}
								style={styles.commentIcon}
							/>
							<Text style={styles.handleText}>评论</Text>
						</View>
					</View>
				</View>
			</TouchableOpacity>
		)
	}
}
export default class List extends Component {
	static navigatorStyle = {
		navBarBackgroundColor: "#ff735c"
	}
	constructor(props) {
		super(props)
		this.state = {
			isLoadingTail: false,
			isRefreshing: false,
			FlatSource: []
		}
	}
	_renderRow = (row) => {
		return <Item
			row={row}
			key={row._id}
			onSelect={() => this._loadPage(row)}
		/>
	}
	_loadPage(row) {
		this.props.navigator.push({
			screen: 'Detail', // unique ID registered with Navigation.registerScreen
			title: "视频详情页", // navigation bar title of the pushed screen (optional)
			passProps: { data: row.item }, // Object that will be passed as props to the pushed screen (optional)
			animated: true, // does the push have transition animation or does it happen immediately (optional)
			backButtonTitle: "返回"
		})
	}
	_hasMore() {
		return cachedResults.items.length !== cachedResults.total
	}
	_fetchMoreData = () => {
		if (!this._hasMore() || this.state.isLoadingTail) {
			return
		}
		let page = cachedResults.nextPage
		this._fetchData(page)
	}
	_onRefresh = () => {
		if (!this._hasMore() || this.state.isRefreshing) {
			return
		} else {
			this._fetchData(0)
		}
	}
	_renderFooter = () => {
		if (!this._hasMore() && cachedResults.total !== 0) {
			return (
				<View style={[styles.loadingMore]}>
					<Text style={styles.loadingText}>我是有底线的...</Text>
				</View>
			)
		}
		if (!this.state.isLoadingTail) {
			return <View style={styles.loadingMore} />
		}
		return <ActivityIndicator style={[styles.loadingMore]} />
	}
	componentDidMount() {
		this._fetchData(1)
	}
	_fetchData(page) {
		let that = this
		if (page !== 0) {
			this.setState({
				isLoadingTail: true
			})
		} else {
			this.setState({
				isRefreshing: true
			})
		}
		request.get(config.api.base + config.api.creations,
			{
				accessToken: "aaaa",
				page: page
			})
			.then((data) => {
				if (data.success) {
					let items = cachedResults.items.slice()
					if (page !== 0) {
						items = items.concat(data.dataMock)
						cachedResults.nextPage += 1

					} else {
						items = data.dataMock.concat(items)
					}

					cachedResults.items = items
					cachedResults.total = data.total
					setTimeout(function () {
						if (page !== 0) {
							that.setState({
								isLoadingTail: false,
								FlatSource: cachedResults.items
							})
						} else {
							that.setState({
								isRefreshing: false,
								FlatSource: cachedResults.items
							})
						}
					}, 20);
				}
			})
			.catch((e) => {
				if (page !== 0) {
					this.setState({
						isLoadingTail: false
					})
				} else {
					this.setState({
						isRefreshing: false
					})
				}
				console.warn("json======" + e)
			})
	}
	render() {
		// Toast.showShortCenter("点赞失败,请稍候再试!")
		return (
			<View style={styles.container}>
				<FlatList
					ListFooterComponent={this._renderFooter}
					renderItem={this._renderRow}
					refreshing={this.state.isRefreshing}
					onRefresh={this._onRefresh}//下拉刷新
					onEndReachedThreshold={10}
					onEndReached={this._fetchMoreData}//上拉加载更多
					enableEmptySections={true}
					showsVerticalScrollIndicator={false}
					automaticallyAdjustContentInsets={false}
					data={this.state.FlatSource}
				/>
			</View>
		)
	}
}
const styles = StyleSheet.create({

	container: {
		flex: 1,
		backgroundColor: "white"

	}, header: {
		paddingTop: 25,
		paddingBottom: 12,
		backgroundColor: "#ee735c"

	}, headerTitle: {
		color: "#fff",
		fontSize: 16,
		textAlign: "center",
		fontWeight: "600"

	},
	item: {
		width: width,
		marginBottom: 10,
		backgroundColor: "#fff"
	},
	thumb: {
		width: width,
		height: width * 0.56,
		resizeMode: "cover"
	},
	title: {
		padding: 10,
		fontSize: 18,
		color: "#333"
	},
	itemFooter: {
		flexDirection: "row",
		justifyContent: "space-between",
		backgroundColor: "white"
	},
	handleBox: {
		padding: 10,
		flexDirection: "row",
		width: width / 2 - 0.5,
		justifyContent: "center",
		backgroundColor: "cyan"

	},
	play: {
		position: "absolute",
		bottom: 14,
		right: 14,
		width: 46,
		height: 46,
		paddingTop: 9,
		paddingBottom: 18,
		paddingLeft: 18,
		paddingRight: 9,
		backgroundColor: "transparent",
		borderColor: "#fff",
		borderWidth: 2,
		borderRadius: 23,
		color: "#ed7b66"
	},
	up: {
		fontSize: 22,
		color: "#ed7b66"
	},
	down: {
		fontSize: 22,
		color: "#333"
	},
	commentIcon: {
		fontSize: 22,
		color: "#ed7b66"
	},
	handleText: {
		paddingLeft: 12,
		fontSize: 18
	},
	loadingMore: {
		marginVertical: -20
	},
	loadingText: {
		color: "cyan",
		textAlign: "center"
	}
})