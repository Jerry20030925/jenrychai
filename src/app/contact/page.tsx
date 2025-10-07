import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "联系我们 - Jenrych AI",
  description: "联系Jenrych AI团队，获取技术支持、商务合作或反馈建议。",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">联系我们</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* 联系信息 */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">联系方式</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">邮箱地址</h3>
                    <p className="text-gray-600 dark:text-gray-400">support@jenrychai.com</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">技术支持</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">客服电话</h3>
                    <p className="text-gray-600 dark:text-gray-400">400-123-4567</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">工作日 9:00-18:00</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">公司地址</h3>
                    <p className="text-gray-600 dark:text-gray-400">北京市朝阳区</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">中国</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">工作时间</h3>
                    <p className="text-gray-600 dark:text-gray-400">周一至周五 9:00-18:00</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">节假日除外</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 联系表单 */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">发送消息</h2>
              
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    姓名 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="请输入您的姓名"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    邮箱 *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="请输入您的邮箱"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    主题 *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">请选择主题</option>
                    <option value="technical">技术支持</option>
                    <option value="business">商务合作</option>
                    <option value="feedback">产品反馈</option>
                    <option value="bug">问题报告</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    消息内容 *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="请详细描述您的问题或建议..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
                >
                  发送消息
                </button>
              </form>
            </div>
          </div>

          {/* 常见问题 */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">常见问题</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Q: 如何获得技术支持？
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  您可以通过邮箱 support@jenrychai.com 或客服电话 400-123-4567 联系我们。
                  我们会在24小时内回复您的邮件。
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Q: 商务合作如何联系？
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  商务合作请发送邮件至 business@jenrychai.com，我们会安排专人对接。
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Q: 反馈建议如何处理？
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  我们非常重视用户的反馈，所有建议都会认真考虑并可能纳入产品改进计划。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
