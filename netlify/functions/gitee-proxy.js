const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  // 从环境变量获取 Gitee Token
  const GITEE_TOKEN = process.env.GITEE_ACCESS_TOKEN;
  const GITEE_OWNER = process.env.GITEE_OWNER || 'yingo-server';
  const GITEE_REPO = process.env.GITEE_REPO || 'yingo';

  // 设置 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { path, method, body, action } = JSON.parse(event.body || '{}');
    
    let url;
    let requestBody = body;
    let requestMethod = method || 'GET';

    // 根据 action 类型构建不同的请求
    switch (action) {
      case 'get_messages':
        // 获取消息文件
        url = `https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/message.json?access_token=${GITEE_TOKEN}`;
        break;

      case 'update_messages':
        // 更新消息文件
        url = `https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/message.json?access_token=${GITEE_TOKEN}`;
        requestMethod = 'PUT';
        break;

      case 'upload_image':
        // 上传图片
        const imageData = body;
        url = `https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${imageData.path}?access_token=${GITEE_TOKEN}`;
        requestMethod = 'POST';
        requestBody = {
          content: imageData.content,
          message: imageData.message,
          branch: 'master'
        };
        break;

      case 'upload_audio':
        // 上传音频
        const audioData = body;
        url = `https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}/contents/${audioData.path}?access_token=${GITEE_TOKEN}`;
        requestMethod = 'POST';
        requestBody = {
          content: audioData.content,
          message: audioData.message,
          branch: 'master'
        };
        break;

      default:
        // 直接代理其他请求
        if (path) {
          url = `https://gitee.com/api/v5${path}?access_token=${GITEE_TOKEN}`;
        } else {
          throw new Error('缺少必要的参数');
        }
    }

    console.log(`Proxying request to: ${url}`);

    const response = await fetch(url, {
      method: requestMethod,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: requestMethod === 'GET' ? undefined : JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gitee API 错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Proxy error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '代理请求失败',
        details: error.message
      })
    };
  }
};