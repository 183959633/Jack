
"use strict"
module.exports = {
	qiniu: {
		AK: "IcfURLhoh40GSa7m2z2IhVND7CGRVi2HFI72efQi",
		SK: "fVVggaHTYgXTxKl9E8WduFZhiOcxRumMZPYUaGAN",
		upload: "http://up-z2.qiniu.com/"//华南区域
		// upload: "http://upload.qiniu.com/"//华北区域
	},
	//CLOUDINARY 上传配置
	cloudinary: {
		cloud_name: "jack007",
		api_key: "118832821594833",
		api_secret: "fRkWnPCrq_zDtz7Wugw78_kn8Fs",
		base: "http://res.cloudinary.com/jack007/",
		image: "https://api.cloudinary.com/v1_1/jack007/image/upload",
		video: "https://api.cloudinary.com/v1_1/jack007/video/upload",
		audio: "https://api.cloudinary.com/v1_1/jack007/raw/upload"
	},
	header: {
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json",
		}
	},
	api: {
		base: "http://rapapi.org/mockjs/22973/",
		creations: "api/creations",
		comment: "api/comments",
		up: "api/up",
		signup: "api/u/signup",
		verify: "api/u/verify",
		update: "api/u/update",
		signature: "api/signature"
	}
}

// http://rapapi.org/mockjs/7634/api/u/signup?phoneNumber=ss
// http://rapapi.org/mockjs/7634/api/creations?accessToken=abc
