export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎉 网站正常运行！
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          如果您能看到这个页面，说明网站已经成功部署并可以访问。
        </p>
        <div className="space-y-4">
          <a 
            href="/" 
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回首页
          </a>
          <a 
            href="/login" 
            className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors ml-4"
          >
            登录页面
          </a>
        </div>
      </div>
    </div>
  );
}
