export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          🎉 Jenrych AI
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          多模态AI助手 - 支持文本、图片、PDF分析
        </p>
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              ✨ 主要功能
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li>• 智能聊天对话</li>
              <li>• 图片内容分析</li>
              <li>• PDF文档解读</li>
              <li>• 多模态AI助手</li>
            </ul>
          </div>
          <div className="flex gap-4 justify-center">
            <a 
              href="/login" 
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              立即登录
            </a>
            <a 
              href="/register" 
              className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              免费注册
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}