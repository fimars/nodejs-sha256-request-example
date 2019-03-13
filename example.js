const crypto = require('crypto');
const fs = require('fs');
const qs = require('querystring');
const https = require('https');

const appid = '';

function randomString(n) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < n; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

let params = {
  content: JSON.stringify({ // 具体参数
    a: 'a',
    b: 'b',
    c: 'c'
  }),
  appid, // APPID
  noncestr: randomString(14), // 14位长度随机字符串，任意方式生成都可以
  timestamp: new Date().getTime()  // 当前时间戳
};

function stringify(params) {
  // 按照key对obj进行排序
  function sorted(o) {
    let p = Object.create(null);
    for (const k of Object.keys(o).sort()) p[k] = o[k];
    return p;
  }
  return qs.stringify(sorted(params), null, null, { encodeURIComponent: qs.unescape })
}

const stringifyParams = stringify(params); // 进行一次qs拼接

/* sha256 签名 */
const sign = crypto.createSign('SHA256');
sign.write(stringifyParams);
sign.end();
const privateKey = fs.readFileSync('./rsa_private.pem');
const signature_b64 = sign.sign(privateKey, 'base64'); // 签名

params.sign = signature_b64; // 添加到params

const raw = JSON.stringify(params); // JSON.stringify一下最后要post的内容
/**
 * 发起一次post请求，可用容易request库，这里直接用的内置https库作为例子
 */
const req = https.request({
  hostname: 'example.cn',
  port: 443,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(raw)
  }
}, function (res) {
  res.setEncoding('utf8');

  let body = '';

  res.on('data', function (chunk) {
    body += chunk
  });

  res.on('end', function () {
    console.log(body);
    console.log(res.statusCode);
  });
});

req.on('error', function (e) {
  console.log("Error: " + e.message);
});

req.write(raw);
req.end();